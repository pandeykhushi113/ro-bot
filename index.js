require("dotenv").config();

const express = require("express");
const { Telegraf } = require("telegraf");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("RO-BOT is live ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

bot.start((ctx) => {
  ctx.reply("Hello! I am RO-BOT 🤖\nAsk me anything.");
});

bot.help((ctx) => {
  ctx.reply("Send me any question and I’ll reply using Gemini AI.");
});

bot.on("text", async (ctx) => {
  try {
    const userMessage = ctx.message.text;

    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();

    await ctx.reply(text);
  } catch (error) {
    console.error(error);

    const errorMessage = error.message || "";

    if (errorMessage.includes("429")) {
      await ctx.reply(
        "⚠️ Gemini quota/rate limit reached. Please wait 30–60 seconds and try again."
      );
    } else {
      await ctx.reply("⚠️ Sorry, something went wrong. Please try again.");
    }
  }
});

bot.launch();

console.log("RO-BOT is running...");require("dotenv").config();

const express = require("express");
const { Telegraf } = require("telegraf");

const app = express();
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

let selectedModel = null;

app.get("/", (req, res) => {
  res.send("RO-BOT is live ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function chooseGeminiModel() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    console.error("Model list error:", data);
    throw new Error("Could not fetch Gemini models");
  }

  const models = data.models || [];

  const usableModels = models
    .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
    .map((model) => model.name);

  console.log("Usable Gemini models:", usableModels);

  const preferredModels = [
    "models/gemini-2.0-flash",
    "models/gemini-1.5-flash-latest",
    "models/gemini-1.5-flash",
    "models/gemini-pro"
  ];

  selectedModel =
    preferredModels.find((model) => usableModels.includes(model)) || usableModels[0];

  console.log("Selected Gemini model:", selectedModel);

  if (!selectedModel) {
    throw new Error("No usable Gemini model found for this API key");
  }
}

async function askGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Gemini API error:", data);
    throw new Error(JSON.stringify(data));
  }

  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "I could not generate a response."
  );
}

bot.start((ctx) => {
  ctx.reply("Hello! I am RO-BOT 🤖\nAsk me anything.");
});

bot.help((ctx) => {
  ctx.reply("Send me any question and I’ll reply using Gemini AI.");
});

bot.on("text", async (ctx) => {
  try {
    const userMessage = ctx.message.text;

    if (!selectedModel) {
      await ctx.reply("⚠️ AI model is still loading. Please try again in 10 seconds.");
      return;
    }

    const reply = await askGemini(userMessage);
    await ctx.reply(reply);
  } catch (error) {
    console.error("Bot error:", error.message);

    if (error.message.includes("429")) {
      await ctx.reply("⚠️ Gemini quota/rate limit reached. Please wait and try again.");
    } else if (error.message.includes("403")) {
      await ctx.reply("⚠️ Gemini API key permission issue. Please check your API key.");
    } else if (error.message.includes("404")) {
      await ctx.reply("⚠️ Gemini model issue. Please check Render logs.");
    } else {
      await ctx.reply("⚠️ Sorry, something went wrong. Please try again.");
    }
  }
});

chooseGeminiModel()
  .then(() => {
    bot.launch();
    console.log("RO-BOT is running...");
  })
  .catch((error) => {
    console.error("Startup error:", error);
  });