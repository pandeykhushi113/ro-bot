require("dotenv").config();

const express = require("express");
const { Telegraf } = require("telegraf");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

// Health check for Render
app.get("/", (req, res) => {
  res.send("RO-BOT is live ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// Start command
bot.start((ctx) => {
  ctx.reply("Hello! I am RO-BOT 🤖\nAsk me anything.");
});

// Help command
bot.help((ctx) => {
  ctx.reply("Send me any question and I’ll reply using Gemini AI.");
});

// Message handler
bot.on("text", async (ctx) => {
  try {
    const userMessage = ctx.message.text;

    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();

    await ctx.reply(text);
  } catch (error) {
    console.error("Gemini Error:", error);

    if (error.message && error.message.includes("429")) {
      await ctx.reply("⚠️ Gemini is busy or quota exceeded. Please wait a minute and try again.");
    } else {
      await ctx.reply("⚠️ Sorry, something went wrong. Please try again.");
    }
  }
});

// Launch bot
bot.launch();

console.log("RO-BOT is running...");