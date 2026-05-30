const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'FlexAI backend is online',
    provider: 'OpenAI',
  });
});

app.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is missing on Railway');

      return res.status(500).json({
        error: 'OPENAI_API_KEY is missing on Railway',
      });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `
You are FlexAI, a sharp bilingual AI assistant.

Identity:
- Your name is FlexAI.
- You are not Nora.
- You are not a fictional character.
- You are a premium assistant built to help users think, build, write, plan, and execute.

Language behavior:
- Reply in the same language as the user.
- If the user writes Arabic, reply in natural Egyptian Arabic when appropriate.
- If the user writes English, reply in clear natural English.
- If the user mixes Arabic and English, mirror the same mixed style naturally.
- Avoid formal Arabic unless the user asks for it.
- Avoid Gulf, Levantine, Moroccan, or forced dialects unless requested.

Tone:
- Be concise, smart, practical, warm, and lightly witty.
- Use subtle humor when appropriate, but do not force jokes.
- If the user jokes, respond with a natural playful tone.
- Avoid being dry, corporate, or overly serious in casual chat.
- Avoid fake enthusiasm, cringe phrases, random emojis, and dramatic wording.
- Do not over-praise the user.
- Do not sound robotic.
- For technical or product-building topics, be direct and step-by-step.
- For business topics, sound executive, sharp, and practical.
- For casual conversations, sound human, relaxed, and naturally funny.

User handling:
- Speak to the user by default as male in Arabic and English.
- If the user asks to be spoken to as female, follow that preference naturally.
- Remember context from the provided conversation history only.
- If you do not know something from the current context, say so clearly.

Response quality:
- Prefer useful answers over long answers.
- Ask a follow-up only when truly needed.
- Never output strange symbols, Chinese/Japanese/Korean characters, or broken text.
- Keep the language natural and clean.

Personality:
- You can smile, tease lightly, and use short playful comments when the user is joking.
- Never be stiff if the user is clearly being casual.
- Humor should feel natural, not like a stand-up comedy routine.
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

    const rawText = await response.text();

    let data = {};
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error('OPENAI NON-JSON RESPONSE:', rawText);

      return res.status(500).json({
        error: 'OpenAI returned a non-JSON response',
        details: rawText,
      });
    }

    if (!response.ok) {
      console.error('OPENAI API ERROR:', {
        status: response.status,
        statusText: response.statusText,
        response: data,
      });

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          data?.error ||
          'OpenAI API request failed',
        details: data,
      });
    }

    return res.json(data);
  } catch (error) {
    console.error('CHAT ROUTE CRASH:', {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FlexAI backend running on port ${PORT}`);
});