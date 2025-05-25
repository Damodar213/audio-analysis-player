# CORS Issue Solution Guide

This guide provides solutions for the CORS and Firebase Auth issues in the music classification application.

## Fixed Issues

1. **Firebase Auth Error**: 
   - Fixed by using the proper enum value for persistence instead of a string literal
   - Wrapped in a try-catch to handle potential errors

2. **CORS Errors with External Audio Files**:
   - Changed sample audio URLs to CORS-friendly sources
   - Added a simple CORS proxy server for development

## Setup Instructions

### Option 1: Use CORS-Friendly Sample URLs (Already Implemented)

The application now uses sample URLs from Google Cloud Storage that allow CORS requests. No additional setup is needed.

### Option 2: Run the CORS Proxy Server (For Custom Audio Sources)

If you want to use other audio sources that don't support CORS:

1. Install the proxy server dependencies:
   ```bash
   npm install --prefix proxy cors express node-fetch@2
   ```

2. Start the proxy server:
   ```bash
   node cors-proxy.js
   ```

3. Update the audio URLs in your application to use the proxy:
   ```
   http://localhost:3001/proxy?url=ORIGINAL_AUDIO_URL
   ```

### Option 3: Configure Firebase Storage CORS (For Production)

1. Install Google Cloud SDK
2. Run the CORS configuration command:
   ```bash
   gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET
   ```

## Running the Application

1. Start the main application:
   ```bash
   npm run dev
   ```

2. If using the proxy server, start it in a separate terminal:
   ```bash
   node cors-proxy.js
   ```

## Troubleshooting

- If you still see CORS errors, check the browser console for specific error messages
- Ensure the proxy server is running if you're using it
- Verify that your Firebase configuration in `.env` is correct 