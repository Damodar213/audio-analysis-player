import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();

// Enable CORS for all routes with additional options
app.use(cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.send('CORS Proxy Server is running');
});

// Route to proxy requests to any external resource
app.get('/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('URL parameter is required');
    }

    console.log(`Proxying request to: ${url}`);
    
    // Add custom headers to the forwarded request
    const requestConfig = {
      method: 'get',
      url: url,
      responseType: 'stream',
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      }
    };
    
    // Forward the request to the target URL
    const response = await axios(requestConfig);

    // Forward the response headers
    Object.keys(response.headers).forEach(header => {
      // Skip setting certain headers that might cause issues
      if (!['content-length', 'content-encoding', 'transfer-encoding'].includes(header.toLowerCase())) {
        res.setHeader(header, response.headers[header]);
      }
    });

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // For audio files, set the correct content type
    if (url.match(/\.(mp3|wav|ogg|flac|aac)$/i)) {
      const ext = url.split('.').pop().toLowerCase();
      const mimeTypes = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        flac: 'audio/flac',
        aac: 'audio/aac'
      };
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    }
    
    // Pipe the response back to the client
    response.data.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    // More detailed error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error(`Headers: ${JSON.stringify(error.response.headers)}`);
      return res.status(error.response.status).send(`Target server responded with: ${error.response.status}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from target server');
      return res.status(504).send('Gateway Timeout: No response from target server');
    } else {
      // Something happened in setting up the request that triggered an Error
      return res.status(500).send(`Proxy error: ${error.message}`);
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CORS Proxy server running on port ${PORT}`);
  console.log(`Use it by accessing: http://localhost:${PORT}/proxy?url=YOUR_URL_HERE`);
}); 