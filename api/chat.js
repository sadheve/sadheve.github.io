export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // Inline bot context to completely prevent Vercel file-system reading crashes
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
