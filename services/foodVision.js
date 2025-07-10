require('dotenv').config();
const vision = require('@google-cloud/vision');
const { OpenAI } = require('openai');

// Instantiate clients
const visionClient = new vision.ImageAnnotatorClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generic substrings to filter out non-specific labels
const GENERIC_SUBSTRINGS = [
  'food','dish','meal','plate','ware','serve','table',
  'utensil','cutlery','kitchen','container','equipment'
];

/**
 * recognizeDishName: Uses Google Vision label detection to pick the most specific food label
 * @param {string} filePath - Path to the uploaded image
 * @returns {Promise<string>} The identified dish name
 */
async function recognizeDishName(filePath) {
  const [res] = await visionClient.labelDetection(filePath);
  const labels = (res.labelAnnotations || []).map(l => l.description);

  // Filter out generic labels
  const specific = labels.filter(name =>
    !GENERIC_SUBSTRINGS.some(sub => name.toLowerCase().includes(sub))
  );

  if (specific.length) return specific[0];
  if (labels.length >= 2) return labels[1];
  if (labels.length >= 1) return labels[0];
  throw new Error('No labels detected by Vision API');
}

/**
 * getIngredients: Uses GPT-4 to generate a list of main ingredients for a given dish name
 * Handles cases where GPT returns either a bare array or an object with an array property.
 * @param {string} dishName
 * @returns {Promise<string[]>} Array of ingredient names
 */
async function getIngredients(dishName) {
  const prompt = `You are a food scientist. Given the dish name "${dishName}", please list the main ingredients as an array of strings in valid JSON. Only output the JSON.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant focused on food analysis.' },
      { role: 'user', content: prompt }
    ]
  });

  const raw = response.choices[0].message.content.trim();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON from OpenAI: ${raw}`);
  }

  // Determine correct array format
  let ingredients;
  if (Array.isArray(parsed)) {
    ingredients = parsed;
  } else if (parsed.ingredients && Array.isArray(parsed.ingredients)) {
    ingredients = parsed.ingredients;
  } else if (parsed.main_ingredients && Array.isArray(parsed.main_ingredients)) {
    ingredients = parsed.main_ingredients;
  } else {
    throw new Error(`Expected JSON array or object with 'ingredients' field got: ${raw}`);
  }

  return ingredients;
}

/**
 * analyzeFood: Main function to identify a dish name and its ingredients from an image
 * @param {string} filePath
 * @returns {Promise<{dishName: string, ingredients: string[]}>}
 */
async function analyzeFood(filePath) {
  const dishName = await recognizeDishName(filePath);
  const ingredients = await getIngredients(dishName);
  return { dishName, ingredients };
}

module.exports = { analyzeFood };
