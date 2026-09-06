import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Standard Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '2mb' }));

// Lazy GoogleGenAI client accessor
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in the environment.');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Fallback Model Ladder ordered by availability and latency as mandated
const FALLBACK_MODEL_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface ReflectRequestBody {
  prompt?: string;
  mode?: 'reflect' | 'summary' | 'brainstorm' | 'chat';
  history?: ChatMessage[];
  title?: string;
}

// Resilient Model Fallback Helper
async function generateContentWithFallback(
  systemInstruction: string,
  contents: string | Array<{ role: string; parts: Array<{ text: string }> }>
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  let lastError: unknown = null;

  for (const modelName of FALLBACK_MODEL_LADDER) {
    try {
      console.log(`[Gemini] Attempting content generation with model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents as any,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text || '';
      if (responseText.trim().length > 0) {
        return { text: responseText, modelUsed: modelName };
      }
    } catch (err: any) {
      console.warn(`[Gemini] Model ${modelName} failed:`, err?.message || err);
      lastError = err;
      // Recoverable error status codes: 503, 429, 404, 500, or network timeouts
      const status = err?.status || err?.statusCode || err?.code;
      const isRecoverable =
        !status ||
        [404, 429, 500, 503, 'UNAVAILABLE', 'RESOURCE_EXHAUSTED', 'NOT_FOUND'].includes(status) ||
        (typeof err?.message === 'string' &&
          (err.message.includes('not found') ||
            err.message.includes('unavailable') ||
            err.message.includes('rate limit') ||
            err.message.includes('overloaded')));

      if (!isRecoverable) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All fallback models in the ladder failed.');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Gemini Reflect / Chat / Summarize Endpoint
app.post('/api/gemini/reflect', async (req, res) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const rawBody = req.body && typeof req.body === 'object' ? req.body : {};
    const body: ReflectRequestBody = rawBody;

    const userPrompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const mode = typeof body.mode === 'string' ? body.mode : 'reflect';
    const entryTitle = typeof body.title === 'string' ? body.title.slice(0, 100) : '';
    const rawHistory = Array.isArray(body.history) ? body.history : [];

    if (!userPrompt && rawHistory.length === 0) {
      res.status(400).json({ error: 'Either prompt or conversation history is required.' });
      return;
    }

    // Sanitize conversation history
    const historySanitized = rawHistory
      .slice(-15) // limit to recent turns for context window control
      .filter((msg) => msg && (msg.role === 'user' || msg.role === 'model') && typeof msg.text === 'string')
      .map((msg) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text.slice(0, 5000) }],
      }));

    // Craft System Prompt based on Mode
    let systemInstruction = `You are a thoughtful, empathetic, and insightful journaling companion and reflection guide. 
Your tone is warm, objective, encouraging, and perceptive.
Help the user deepen their self-awareness, organize their thoughts, and discover constructive insights without being preachy or clichéd.`;

    if (mode === 'summary') {
      systemInstruction += `\nProvide an elegant, structured summary of the user's reflection, highlighting key feelings, core themes, and a gentle concluding takeaway.`;
    } else if (mode === 'brainstorm') {
      systemInstruction += `\nProvide creative, actionable brainstorming ideas, next steps, and perspective-expanding questions based on what the user shared.`;
    } else {
      systemInstruction += `\nEngage naturally with the user's reflection, validating their experiences, offering fresh angles of inquiry, and asking 1-2 open-ended questions to spur deeper reflection.`;
    }

    // Prepare contents payload
    let contentsPayload: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (historySanitized.length > 0) {
      contentsPayload = [...historySanitized];
      if (userPrompt) {
        contentsPayload.push({
          role: 'user',
          parts: [{ text: userPrompt.slice(0, 10000) }],
        });
      }
    } else {
      const formattedInput = entryTitle
        ? `Title: ${entryTitle}\n\nReflection:\n${userPrompt.slice(0, 10000)}`
        : userPrompt.slice(0, 10000);
      contentsPayload = [
        {
          role: 'user',
          parts: [{ text: formattedInput }],
        },
      ];
    }

    const { text, modelUsed } = await generateContentWithFallback(systemInstruction, contentsPayload);

    res.json({
      reply: text,
      modelUsed,
      mode,
    });
  } catch (error: any) {
    console.error('Error generating Gemini response:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate response with Gemini',
    });
  }
});

async function startServer() {
  // Mount Vite middleware for dev or serve static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
