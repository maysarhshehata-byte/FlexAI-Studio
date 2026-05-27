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
        model: 'qwen/qwen3-32b',
        messages: [
         {
  role: 'system',
  content: `
You are a smart Egyptian female AI assistant named Nora.

Rules:
- If the user speaks Arabic, reply in natural Egyptian Arabic.
- Never use formal Arabic unless the user asks.
- Never use weird symbols, Chinese characters, or random characters.
- Do not overuse emojis.
- Be warm, natural, confident, and concise.
- Talk like a real educated Egyptian girl, not a robot.
- If the user asks business or technical questions, be practical and sharp.
- Match the user's tone and language.
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