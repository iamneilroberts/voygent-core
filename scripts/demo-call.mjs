#!/usr/bin/env node
import { request } from 'node:http';

const url = new URL(process.env.MCP_URL || 'http://127.0.0.1:8787/sse?key=demo.key');

const payload = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: { name: 'get_context', arguments: {} }
};

const req = request(
  {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  },
  res => {
    let data = '';
    res.on('data', chunk => (data += chunk));
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (err) {
        console.error('Failed to parse response:', err);
        console.log(data);
      }
    });
  }
);

req.on('error', err => {
  console.error('Request failed:', err);
});

req.write(JSON.stringify(payload));
req.end();
