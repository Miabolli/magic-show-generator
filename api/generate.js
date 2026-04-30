// api/generate.js
// Handles two modes: 'magic_show' and 'quick_win'.
// API key lives in a Vercel environment variable.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode, topic, audience, workflow } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server is not configured with an API key' });
  }

  let prompt;

  if (mode === 'quick_win') {
    if (!workflow) {
      return res.status(400).json({ error: 'Missing workflow' });
    }

    prompt = `You are helping Mia Bauza Mas, a candidate applying to be the AI Explorer at Nedstar (a Dutch ethanol trading company in Amsterdam, ~30 people). The role is about finding "low-hanging fruit" — quick wins where AI can save someone time, reduce errors, or spark new ideas — and sharing them across the team.

A Nedstar team member has described this current workflow:

"${workflow}"

Generate three specific, practical AI-powered improvements they could try this week. For each one, use this exact structure:

## Quick win [1, 2, or 3]: [Short punchy title]

**The tool:** [Name a specific AI tool — Claude, ChatGPT, NotebookLM, Perplexity, etc. — and which mode/feature]

**What to do:** [3-4 bullet points of concrete steps. Be specific about what to type, what to upload, what to click. No vague advice.]

**Time saved:** [A realistic estimate like "30 minutes per day" or "2 hours per week"]

**Watch out for:** [One honest caveat — what could go wrong, what needs human review, what data should not be shared with AI]

After all three, add a final section:

## 🎩 Magic Show potential

One sentence on which of these three would make the strongest internal demo for the rest of the team, and why.

Tone: warm, curious, energetic, plain-spoken. No jargon. No "leveraging synergies." Talk like a smart friend who's spent time with these tools.

IMPORTANT: When the workflow involves legal, financial, medical, HR, or compliance work, always include a clear note in "Watch out for" that AI is a starting point and not a replacement for qualified professional review. Never suggest AI can replace a lawyer, accountant, doctor, or compliance officer.

At the very end, after the Magic Show potential section, add a single italic line: *AI-generated. Verify outputs before relying on them in real work.*`;

  } else {
    // Default: magic_show mode
    if (!topic) {
      return res.status(400).json({ error: 'Missing topic' });
    }

    prompt = `You are helping Mia Bauza Mas, a candidate applying to be the AI Explorer at Nedstar (a Dutch ethanol trading company in Amsterdam, ~30 people). The role's only deliverable is a weekly internal presentation called "The Magic Show" — a 5 to 15 minute demo of something genuinely useful that AI can do for the team.

Generate a complete Magic Show script for this topic: "${topic}"

The audience is: ${audience || 'the whole Nedstar team'}

Structure the output exactly like this, using these section headers (keep the emoji as part of the heading):

## 🎩 The hook
(one or two sentences to open with energy)

## 🔧 The live demo
(a clear, step-by-step walk-through of what AI tool to use, what to type into it, and what the team will see happen on screen — be specific and concrete, name the actual tool)

## 💡 Why this matters for Nedstar
(two or three sentences connecting it to ethanol trading, logistics, risk, ops, or team operations — show genuine business sense)

## ⚡ The quick win
(one realistic, low-effort change someone could make this week to start using it)

## 🤔 Discussion questions
(three short questions to spark conversation with the team after the demo, as a numbered list)

## 📚 Sources & further reading
(three to five credible sources where the team can verify and dig deeper, as a bullet list. Include the source name and a short note on why it's useful. Examples: "EUR-Lex (the official EU legal database) — full text of the AI Act", "Anthropic's documentation at docs.anthropic.com — current Claude capabilities and limits", "the EU AI Office website — official guidance and FAQs". If a topic is too niche for well-known sources, suggest source types instead like "your industry's regulator" or "Google Scholar for peer-reviewed research")

Tone: warm, curious, energetic, plain-spoken. No jargon. No "leveraging synergies." Talk like a smart friend who's excited to share something they found.

IMPORTANT: When the topic touches legal, regulatory, compliance, financial, medical, or HR matters, always include a clear note that AI is a starting point and not a substitute for qualified professional advice. Frame AI as helping people prepare for and structure conversations with experts, not replace them. Never tell users they can avoid hiring a lawyer, accountant, doctor, or other licensed professional. Be specific: name the type of professional they should still consult.

At the very end of every Magic Show, after the Sources section, add a single italic line: *AI-generated. Sources are starting points, not citations. Verify before using in formal work.*

Length: aim for around 400-500 words total. Make every sentence earn its place.`;
  }

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
