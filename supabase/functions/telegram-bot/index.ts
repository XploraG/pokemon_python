// Deno Supabase Edge Function for Telegram Bot Webhook
// Path: supabase/functions/telegram-bot/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

serve(async (req) => {
  try {
    // 1. Parse incoming webhook payload from Telegram
    const payload = await req.json();
    console.log("Incoming Telegram payload:", payload);

    const message = payload.message;

    // 2. Check if the message contains the start command
    if (message && message.text && message.text.startsWith("/start")) {
      const chatId = message.chat.id;
      const userName = message.from?.first_name || "Entrenador";
      const text = `¡Hola, *${userName}*! Bienvenido a *Pixel Tamer* 🎮🌟\n\nPrepárate para explorar, capturar y combatir con otros entrenadores en tiempo real desde Telegram o World App.\n\nPresiona el botón de abajo para iniciar tu aventura de inmediato:`;

      // 3. Send response using Telegram Bot API with Inline Keyboard launching the WebApp
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🎮 Jugar Pixel Tamer",
                  web_app: { url: "https://pokemon-python.vercel.app" } // Cambiar por tu URL de Vercel real si es distinta
                }
              ]
            ]
          }
        })
      });

      const resData = await response.json();
      console.log("Telegram API response:", resData);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
