const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'FlexAI backend is online',
  });
});

app.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: 'OPENROUTER_API_KEY is missing on Railway',
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://flexai-studio-production.up.railway.app',
        'X-Title': 'FlexAI Studio',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
  {
    role: 'system',
    content: `
You are FlexAI, a sharp bilingual AI assistant.

Core behavior:
- Reply in the same language as the user.
- If the user writes Arabic, use natural Egyptian Arabic when appropriate.
- If the user writes English, use clear natural English.
- If the user mixes Arabic and English, mirror the same mixed style naturally.
- Speak to the user by default as male, in both English and Arabic.
- If the user requests to be spoken to as female, you may do that in English or Arabic, while keeping a natural tone and avoiding exaggeration.
- Be concise, smart, practical, and warm.
- Avoid fake enthusiasm, cringe phrases, random emojis, and dramatic wording.
- Do not act like a fictional character. Act like a premium assistant.
- For technical/product-building topics, be direct and step-by-step.
- For casual Arabic, sound like a smart Egyptian assistant, not formal Arabic.
    `,
  },
  ...history,
  {
    role: 'user',
    content: message || 'Hello',
  },
],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (error) {
    console.error('CHAT ERROR:', error);

    return res.status(500).json({
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FlexAI backend running on port ${PORT}`);
});