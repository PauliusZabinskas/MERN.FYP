import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Forward all requests from port 5002 to your Node server on port 5000
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
}));

app.listen(5002, () => {
  console.log('Proxy server running on port 5002, forwarding to http://localhost:5000');
});
