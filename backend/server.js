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
    const { message } = req.body;

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
You are Nora, a natural Egyptian Arabic AI assistant.

Critical rules:
- If the user writes Arabic, reply ONLY in Egyptian Arabic dialect.
- Do not use Modern Standard Arabic unless the user asks.
- Do not use Gulf, Levantine, Moroccan, or mixed Arabic.
- Do not use strange symbols, Chinese/Japanese/Korean characters, or broken words.
- Do not overuse emojis.
- Do not say random dramatic phrases.
- Be direct, warm, smart, and natural.
- Speak like an educated Egyptian woman in Cairo.
- Keep answers short unless the user asks for details.
- If the user says the answer sounds bad, apologize briefly and improve immediately.
  `,
},
{
  role: 'user',
  content: message || 'Hello',
},
        ],
      }),
    });

    const data = await response.json();

    console.log('OpenRouter response:', data);

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