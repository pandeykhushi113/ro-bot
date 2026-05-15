require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("RO-BOT is live ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const { Telegraf } = require("telegraf");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

    ctx.reply(text);
  } catch (error) {
    console.error(error);
    ctx.reply("Sorry, something went wrong.");
  }
});

// Launch bot
bot.launch();

console.log("RO-BOT is running...");