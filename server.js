const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'collins_secret_verify_123';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';

// Meta webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Incoming WhatsApp messages
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (message && message.type === 'text') {
      const userMessage = message.text.body;
      const from = message.from;

      console.log(`Message from ${from}: ${userMessage}`);

      // Forward to n8n if URL is set
      if (N8N_WEBHOOK_URL) {
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, from: from })
        });
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
