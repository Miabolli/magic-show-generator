// api/generate.js
// Vercel serverless function that proxies requests to the Anthropic API.
// The API key lives in a Vercel environment variable, never in the browser.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, audience } = req.body || {};
  if (!topic) {
    return res.status(400).json({ error: 'Missing topic' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is not configured with an API key' });
  }

  const prompt = `You are helping Mia Bauza Mas, a candidate applying to be the AI Explorer at Nedstar (a Dutch ethanol trading company in Amsterdam, ~30 people). The role's only deliverable is a weekly internal presentation called "The Magic Show" — a 5 to 15 minute demo of something genuinely useful that AI can do for the team.

Generate a complete Magic Show script for this topic: "${topic}"

The audience is: ${audience || 'the whole Nedstar team'}

Structure the output exactly like this, using these section headers:

🎩 THE HOOK (one or two sentences to open with energy)

🔧 THE LIVE DEMO (a clear, step-by-step walk-through of what AI tool to use, what to type into it, and what the team will see happen on screen — be specific and concrete, name the actual tool)

💡 WHY THIS MATTERS FOR NEDSTAR (two or three sentences connecting it to ethanol trading, logistics, risk, ops, or team operations — show genuine business sense)

⚡ THE QUICK WIN (one realistic, low-effort change someone could make this week to start using it)

🤔 DISCUSSION QUESTIONS (three short questions to spark conversation with the team after the demo)

Tone: warm, curious, energetic, plain-spoken. No jargon. No "leveraging synergies." Talk like a smart friend who's excited to share something they found.

Length: aim for around 350-450 words total. Make every sentence earn its place.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return res.status(response.status).json({
        error: `Anthropic API returned ${response.status}`
      });
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    return res.status(200).json({ text });

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
