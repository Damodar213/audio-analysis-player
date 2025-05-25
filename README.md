# Music Genre Classifier

A web application for uploading, analyzing, and organizing your music collection by genre.

## Features

- Upload music files and analyze their genre
- Visualize waveforms and play music
- Organize your music library by genre
- Responsive design for desktop and mobile

## Setup

1. Clone this repository
2. Install dependencies
   ```
   npm install
   ```
3. Start the development server
   ```
   npm run dev
   ```

## CORS Issues with Firebase Storage

If you're experiencing CORS errors with Firebase Storage, you have two options:

### Option 1: Configure Firebase Storage CORS (Recommended)

1. Install Firebase CLI
   ```
   npm install -g firebase-tools
   ```
2. Login to Firebase
   ```
   firebase login
   ```
3. Initialize Firebase in your project
   ```
   firebase init storage
   ```
4. Deploy CORS configuration
   ```
   firebase deploy --only storage
   ```

### Option 2: Use the CORS Proxy Server

1. Start the CORS proxy server
   ```
   node cors-proxy-server.js
   ```
2. The proxy will run on port 3001 and automatically handle CORS issues

## Troubleshooting

### Audio not playing

If you encounter issues with audio playback:

1. Make sure the CORS proxy server is running
2. Check browser console for specific errors
3. The application has a fallback player that should activate automatically

### Upload stuck at 100%

If your upload gets stuck at 100%:

1. Check your Firebase configuration
2. Make sure you have proper authentication setup
3. The application will switch to test mode if uploads fail

## Development Mode

The app has a test mode that doesn't require Firebase connection. This is enabled by default for easier development.

To disable test mode and use actual Firebase:
- Set `bypassFirebaseForTesting` to `false` in the `songStore.ts` file

## License

This project is licensed under the MIT License - see the LICENSE file for details. 