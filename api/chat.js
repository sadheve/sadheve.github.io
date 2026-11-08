import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const botContext = require('../bot-context.json');

export default async function handler(req, res) {
  // Always set CORS headers first thing
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body || {};
    if (!message) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel environment variables.' });
    }

    const contextData = JSON.stringify(botContext, null, 2);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ 
            text: `System Context & Business Data:\n${contextData}\n\nUser Question: ${message}\n\nInstructions: You are the professional AI support assistant for Sadheve Dias Portfolio website. Answer questions concisely and accurately using the business data provided above.` 
          }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to communicate with Gemini API');
    }

    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ reply: botReply });

  } catch (error) {
    console.error('API Error:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: error.message });
  }
}
