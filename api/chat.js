export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const message = body?.message || '';

    if (!message) {
      return res.status(400).json({ error: 'Message field is missing.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel environment variables.' });
    }

    const botContext = {
      "business_name": "Sadheve Dias",
      "about": "We craft stunning, high-converting websites and engineer custom AI solutions. Blending creative design with intelligent automation, we build digital experiences that elevate brands, automate workflows, and drive measurable results.",
      "services": [
        "Strategy: Custom digital experience planning.",
        "Web Design: Visually striking, high-converting layouts.",
        "Branding: Brand identity development.",
        "UI/UX: User interface and experience architecture."
      ],
      "contact_info": {
        "email": "sadheve30@gmail.com",
        "note": "Users can fill out the contact form directly on the page to leave their name, email, phone number, and project ideas."
      },
      "faq": [
        {
          "question": "What services do you provide?",
          "answer": "I specialize in custom Strategy, Web Design, Branding, and UI/UX design, integrating intelligent AI solutions to build high-performing web platforms."
        },
        {
          "question": "How can I contact you?",
          "answer": "You can reach me directly via email at sadheve30@gmail.com or by using the contact form at the bottom of the page."
        }
      ]
    };

    const contextData = JSON.stringify(botContext);
    const promptText = `System Context & Business Data:\n${contextData}\n\nUser Question: ${message}\n\nInstructions: You are the professional AI support assistant for Sadheve Dias Portfolio website. Answer questions concisely and accurately using the business data provided above.`;

    // Try gemini-2.5-flash first, fallback to gemini-2.0-flash
    const supportedModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let botReply = null;
    let lastError = null;

    for (const model of supportedModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          })
        });

        const data = await response.json();

        if (response.ok) {
          botReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (botReply) break;
        } else {
          lastError = data.error?.message || `Error with model ${model}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!botReply) {
      return res.status(500).json({ error: lastError || 'Failed to generate response from Gemini API.' });
    }

    return res.status(200).json({ reply: botReply });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
