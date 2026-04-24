export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { messages, system } = req.body;

  const allMessages = [
    { role: 'system', content: system },
    ...messages
  ];

  // Try multiple free models in order until one works
  const models = [
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-chat:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-3-27b-it:free'
  ];

  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
          'HTTP-Referer': 'https://arminio-responde.vercel.app',
          'X-Title': 'Los Hermanos de Arminio'
        },
        body: JSON.stringify({
          model: model,
          messages: allMessages,
          max_tokens: 1000
        })
      });

      const data = await response.json();

      if (data.choices?.[0]?.message?.content) {
        return res.status(200).json({ content: [{ type: 'text', text: data.choices[0].message.content }] });
      }

      lastError = data.error?.message || 'No content';

    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(500).json({ error: 'All models failed: ' + lastError });
}
