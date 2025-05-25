const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());

// Proxy endpoint
app.get('/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('URL parameter is required');
    }
    
    console.log(`Proxying request to: ${url}`);
    const response = await fetch(url);
    const buffer = await response.buffer();
    
    // Copy the content type header
    res.set('Content-Type', response.headers.get('content-type'));
    res.send(buffer);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send(`Proxy error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`CORS proxy server running at http://localhost:${port}`);
  console.log(`Example usage: http://localhost:${port}/proxy?url=https://example.com/audio.mp3`);
}); 