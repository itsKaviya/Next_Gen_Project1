const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

async function listModels() {
  try {
    const models = await genAI.listModels();
    console.log("✅ Available Models:\n", models);
  } catch (err) {
    console.error("❌ Error fetching models:", err);
  }
}

listModels();