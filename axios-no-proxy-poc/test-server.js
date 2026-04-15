/**
 * Simple test server to receive requests
 * Run this to test actual requests instead of connection errors
 */

const express = require('express');
const app = express();
const PORT = 8080;

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[TEST SERVER] ${req.method} ${req.url}`);
  console.log(`[TEST SERVER] Host: ${req.headers.host}`);
  console.log(`[TEST SERVER] X-Forwarded-For: ${req.headers['x-forwarded-for'] || 'none'}`);
  console.log(`[TEST SERVER] Via: ${req.headers['via'] || 'none'}`);
  next();
});

app.get('*', (req, res) => {
  res.json({
    message: 'Request received',
    host: req.headers.host,
    url: req.url,
    wasProxied: !!(req.headers['x-forwarded-for'] || req.headers['via'])
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server listening on all interfaces, port ${PORT}`);
  console.log(`You can test with: localhost, localhost., 127.0.0.1, 127.0.0.1., [::1]`);
});
