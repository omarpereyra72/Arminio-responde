export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
  }

  const body = await req.json();
  const { messages, system } = body;

  // Prepend system message for OpenRouter
  const allMessages = [
    { role: 'system', content: system },
    ...messages
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://arminio-responde.vercel.app',
      'X-Title': 'Los Hermanos de Arminio'
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct:free',
      messages: allMessages,
      max_tokens: 1000
    })
  });

  const data = await response.json();

  // Convert OpenRouter response format to Anthropic-like format
  const reply = data.choices?.[0]?.message?.content || 'No se pudo obtener respuesta.';
  const converted = {
    content: [{ type: 'text', text: reply }]
  };

  return new Response(JSON.stringify(converted), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
