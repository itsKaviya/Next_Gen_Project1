const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing GOOGLE_GEMINI_API_KEY in environment.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const result = await model.generateContent('Hello');
  console.log(result.response.text());
}

test().catch((err) => {
  console.error('Gemini test error:', err);
  process.exit(1);
});
