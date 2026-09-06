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
gcloud config set project gen-lang-client-0640385882

# Enable the required Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com
