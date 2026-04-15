const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION;

const getGeminiModel = (modelName) => {
  const options = { model: modelName };
  if (GEMINI_API_VERSION) options.apiVersion = GEMINI_API_VERSION;
  return genAI.getGenerativeModel(options);
};

const FALLBACK_MODELS = [
  GEMINI_MODEL,
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-pro-latest',
];

const isRetryableGeminiError = (error) => {
  const status = error?.status || error?.statusCode;
  return status === 429 || status === 503 || status === 504;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseActivitiesString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null;
  try {
    let jsonLike = trimmed;
    if (jsonLike.includes('+')) {
      const lines = jsonLike.split('\n').map((raw) => {
        let line = raw.trim();
        line = line.replace(/\+\s*$/, '');
        if (
          (line.startsWith('"') && line.endsWith('"')) ||
          (line.startsWith("'") && line.endsWith("'")) ||
          (line.startsWith('`') && line.endsWith('`'))
        ) {
          line = line.slice(1, -1);
        }
        return line;
      });
      jsonLike = lines.join('\n');
    }
    jsonLike = jsonLike.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
    jsonLike = jsonLike.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
    jsonLike = jsonLike.replace(/,\s*([}\]])/g, '$1');
    const parsed = JSON.parse(jsonLike);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const generateWithRetry = async (prompt) => {
  const errors = [];
  for (const modelName of FALLBACK_MODELS) {
    const model = getGeminiModel(modelName);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await model.generateContent(prompt);
      } catch (error) {
        if (!isRetryableGeminiError(error) || attempt === 2) {
          errors.push({ modelName, error });
          break;
        }
        await sleep(300 * (attempt + 1));
      }
    }
  }
  const last = errors[errors.length - 1];
  if (last?.error) throw last.error;
  throw new Error('Gemini request failed after retries');
};

console.log(`Gemini config -> model: ${GEMINI_MODEL}, apiVersion: ${GEMINI_API_VERSION || 'default'}`);

// Feasibility check
router.post('/feasibility', auth, async (req, res) => {
  try {
    const { startCity, destination, startDate, endDate, themes, preferences, budget, passengers } = req.body;
    
    const prompt = `You are a travel planning AI. Analyze the feasibility of this trip and respond ONLY with valid JSON (no markdown, no code blocks).

Trip Details:
- Start: ${startCity}
- Destination: ${destination}
- Dates: ${startDate} to ${endDate}
- Themes: ${themes?.join(', ') || 'General'}
- Accommodation: ${preferences?.accommodation || 'Any'}
- Food: ${preferences?.food?.join(', ') || 'Any'}
- Transport to destination: ${preferences?.transportTo || 'Any'}
- Passengers: ${passengers}
- Budget: ${budget?.amount || 0} ${budget?.currency || 'INR'}

Return this exact JSON structure:
{
  "suggestedBudgetMin": <number in ${budget?.currency || 'INR'}>,
  "suggestedBudgetMax": <number in ${budget?.currency || 'INR'}>,
  "budgetExplanation": "<detailed explanation of budget breakdown>",
  "missingExperiences": ["<experience1>", "<experience2>", "<experience3>", "<experience4>", "<experience5>"],
  "alternativeDestinations": [
    {"name": "<city>", "reason": "<why similar/better>"},
    {"name": "<city>", "reason": "<why>"},
    {"name": "<city>", "reason": "<why>"},
    {"name": "<city>", "reason": "<why>"},
    {"name": "<city>", "reason": "<why>"}
  ],
  "feasibilityScore": <1-10>,
  "warnings": ["<warning if any>"]
}`;

    const result = await generateWithRetry(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleaned);
    res.json(data);
  } catch (error) {
    console.error('Gemini feasibility error:', error);
    res.status(500).json({ message: 'AI analysis failed', error: error.message });
  }
});

// Generate full travel plan
router.post('/generate-plan', auth, async (req, res) => {
  try {
    const { startCity, destination, startDate, endDate, themes, preferences, budget, passengers, additionalNotes } = req.body;
    
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const duration = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;
    
    const prompt = `You are an expert travel planner. Create a detailed day-by-day travel itinerary. Respond ONLY with valid JSON (no markdown, no code blocks, no extra text).

Trip:
- From: ${startCity}
- To: ${destination}  
- Dates: ${startDate} to ${endDate} (${duration} days)
- Themes: ${themes?.join(', ') || 'General Tourism'}
- Pace: ${preferences?.pace || 'Balanced'}
- Accommodation: ${preferences?.accommodation || 'Any'}
- Food preferences: ${preferences?.food?.join(', ') || 'Local Cuisine'}
- Transport: ${preferences?.transportTo || 'Any'}
- Passengers: ${passengers}
- Notes: ${additionalNotes || 'None'}

Return this EXACT JSON:
{
  "title": "<Destination> Adventure",
  "highlights": ["<highlight1>", "<highlight2>", "<highlight3>", "<highlight4>", "<highlight5>"],
  "packingList": ["<item1>", "<item2>", "<item3>", "<item4>", "<item5>", "<item6>", "<item7>", "<item8>", "<item9>", "<item10>"],
  "weatherInfo": {
    "summary": "<brief weather summary for travel dates>",
    "avgTemp": "<temperature range>",
    "conditions": "<expected conditions>",
    "tips": ["<tip1>", "<tip2>", "<tip3>"]
  },
  "itinerary": [
    {
      "day": 1,
      "date": "${startDate}",
      "title": "<Day theme title>",
      "activities": [
        {
          "time": "09:00 AM",
          "name": "<Activity name>",
          "description": "<2-3 sentence description>",
          "location": "<specific location name>",
          "type": "sightseeing|food|transport|accommodation|adventure|culture|shopping",
          "cost": <estimated cost in INR as number>,
          "duration": "<duration like 2 hours>",
          "tips": "<insider tip>"
        }
      ]
    }
  ]
}

Create ${duration} days of detailed activities. Each day should have 4-6 activities including meals and main attractions. Make it realistic and specific to ${destination}.`;

    const result = await generateWithRetry(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Find JSON boundaries
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}') + 1;
    const jsonStr = cleaned.slice(jsonStart, jsonEnd);
    
    const data = JSON.parse(jsonStr);

    // Normalize activities if they are strings
    if (Array.isArray(data.itinerary)) {
      data.itinerary = data.itinerary.map((day, idx) => {
        const activitiesRaw = Array.isArray(day?.activities)
          ? day.activities
          : parseActivitiesString(day?.activities);
        return {
          ...day,
          day: typeof day?.day === 'number' ? day.day : idx + 1,
          activities: Array.isArray(activitiesRaw) ? activitiesRaw : []
        };
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Gemini plan error:', error);
    res.status(500).json({ message: 'Plan generation failed', error: error.message });
  }
});

// Place autocomplete using Gemini
router.post('/places-suggest', auth, async (req, res) => {
  try {
    const { query } = req.body;
    const prompt = `Return a JSON array of 5 travel destination suggestions matching "${query}". Only respond with JSON array, no other text.
Format: [{"name": "City, Country", "description": "brief description", "type": "city|country|region"}]`;
    
    const result = await generateWithRetry(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleaned);
    res.json(data);
  } catch (error) {
    console.error('Gemini places-suggest error:', error);
    res.json([]);
  }
});

module.exports = router;
