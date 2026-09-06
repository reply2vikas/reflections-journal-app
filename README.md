# Reflections Journal

A user-authenticated web application integrating Google Gemini 3.6 Flash and Cloud Firestore for private, intelligent journaling and multi-turn reflections.

---

## Architecture & Security Highlights

- **User Authentication**: Firebase Authentication with federated Google Sign-In, eliminating the risks of self-managed credentials.
- **Data Isolation**: Cloud Firestore configured with strict owner-bound security rules (`/users/{userId}/**`), ensuring complete data privacy across different users.
- **Server-Side AI Proxy**: Gemini API access is mediated entirely server-side (`/api/gemini/reflect`), protecting the `GEMINI_API_KEY` from client-side bundles.
- **Model Fallback Ladder**: Dynamic fallback chain (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`) with automated retry on transient upstream capacity issues.
- **Payload & Transaction Hygiene**: Zero-crash payload sanitizer stripping `undefined` attributes, with UI buffer retention and retry mechanisms.

---

## 1. Prerequisites & GCP Setup

Ensure you have the Google Cloud SDK (`gcloud`) installed and authenticated:

```bash
# Log in to Google Cloud
gcloud auth login

# Set your target project ID
gcloud config set project YOUR_PROJECT_ID

# Enable the required Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com
```

---

## 2. Secret Manager Configuration

Store your Gemini API key in Google Cloud Secret Manager and grant the Cloud Run runtime service account permission to access it:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Identify your default Compute Engine / Cloud Run service account
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant the service account read access to the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Firestore Security Rules

Deploy the owner-bound security rules to ensure strict isolation of journal entries and conversation interactions:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

To deploy via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Google Cloud Run Deployment

Build and deploy the application container to Google Cloud Run:

```bash
# Deploy from source using Cloud Build & Cloud Run
gcloud run deploy reflections-journal \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

---

## 5. Mandatory Campaign Verification Labeling

Apply the required challenge label to register the deployed Cloud Run service for automated challenge verification:

```bash
gcloud run services update reflections-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Local Development

```bash
# Install dependencies
npm install

# Start local full-stack dev server on port 3000
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```
