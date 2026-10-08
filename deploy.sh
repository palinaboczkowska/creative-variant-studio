#!/bin/sh
# Builds the app from source and deploys it to Cloud Run in europe-north1.
set -e
cd "$(dirname "$0")"
gcloud run deploy creative-variant-studio \
  --source . \
  --region europe-north1 \
  --allow-unauthenticated \
  --set-secrets=ANTHROPIC_API_KEY=anthropic-key:latest \
  --max-instances=1 \
  --memory=1Gi \
  --quiet
