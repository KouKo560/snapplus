const https = require('https');

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1502745780304347257/oEywgtEnyzR6OncpQYn5wq9VxcRwTFDdjInd6TNo5sFCB2Dz7kMB-k7KNMpZZYQzzhX6';

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    console.log('api/webhook called with wrong method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = await parseJsonBody(req);
    console.log('api/webhook called', { method: req.method, payloadPresent: !!payload });

    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'Empty payload' });
    }

    const url = new URL(DISCORD_WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Webhook-Proxy/1.0'
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });

    if (response.statusCode >= 200 && response.statusCode < 300) {
      res.status(200).json({ success: true });
    } else {
      res.status(response.statusCode).json({ error: 'Discord webhook failed', details: response.data });
    }
  } catch (error) {
    console.error('Webhook proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};