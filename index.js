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
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

console.log("RO-BOT is running...");