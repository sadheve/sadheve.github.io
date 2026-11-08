export default async function handler(req, res) {
  // Block any non-POST requests to ensure security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; // Safely reads your key inside the secure server vault

    // Secure server-to-server call directly to the Google Gemini API endpoint
    const response = await fetch(`https://googleapis.com{apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: message + " (Context: You are the professional AI support assistant for Sadheve Dias Portfolio website. Answer questions concisely using information from the page. Always append exactly two relevant emojis to the very end of your response.)" }]
        }]
      })
    });

    const data = await response.json();
    
    // Extract the text output safely from the Gemini layout structure
    const botReply = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ reply: botReply });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
