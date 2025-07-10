require('dotenv').config();
const { OpenAI } = require('openai');

// Instantiate OpenAI client (SDK v4)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * checkInteractions: for given ingredients and medications, returns detailed interactions and recommendations
 * @param {string[]} ingredients - list of food ingredients
 * @param {string[]} medications - list of patient medications
 * @returns {Promise<Array<{ medication: string, interaction: string, recommendation: string }>>}
 */
exports.checkInteractions = async (ingredients, medications) => {
  const prompt = `
You are a clinical pharmacologist. Given these inputs:

Ingredients of the scanned dish:
${ingredients.map(i => `- ${i}`).join('\n')}

Patient's current medications:
${medications.map(m => `- ${m}`).join('\n')}

For each medication, do the following:
1. Indicate if any ingredient poses an interaction risk.
2. Briefly describe the nature of the interaction and possible consequences.
3. Provide a clear recommendation: either "Safe to consume together" or "Avoid [specific foods] with timing guidelines", or "Prefer [specific foods]" if appropriate.

Respond ONLY in valid JSON: an array of objects with keys:
- medication (string)
- interaction (string)
- recommendation (string)

Example output:
[
  {
    "medication": "Phenelzine",
    "interaction": "Tyramine-rich foods can cause hypertensive crisis.",
    "recommendation": "Avoid aged cheeses, red wine, cured meats, and dried mushrooms at least 2 days before and up to 3 days after treatment."
  },
  {
    "medication": "Atorvastatin",
    "interaction": "No known interaction with these ingredients.",
    "recommendation": "Safe to consume together."
  }
]
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a knowledgeable clinical pharmacologist.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0
  });

  const raw = response.choices[0].message.content.trim();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse JSON from AI: ${raw}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected an array of interaction objects but received: ${raw}`);
  }

  return parsed;
};
