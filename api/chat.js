import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Enable CORS for your portfolio domain
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Block any non-POST requests to ensure security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; // Safely reads your key inside the secure server vault

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on Vercel environment variables.' });
    }

    // Load context data from bot-context.json safely
    let contextData = '';
    try {
      const filePath = path.join(process.cwd(), 'bot-context.json');
      const fileContents = fs.readFileSync(filePath, 'utf8');
      contextData = fileContents;
    } catch (err) {
      console.warn('Could not read bot-context.json:', err);
    }

    // Secure server-to-server call directly to the Google Gemini API endpoint
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

    // Extract the text output safely from the Gemini layout structure
    const botReply = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ reply: botReply });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
