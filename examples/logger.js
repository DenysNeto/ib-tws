// CHANNEL_ID Order calls :: "-1001568215679"
// CHANNEL_ID pinescript_test :: "-1001967555467"   (default)

// BOT TOKEN PineScript :: "6271843557:AAEQ6ifCSa5En8lmtWvJ3kPYU-cTPYK6XmE"

import alert from "alert";
import { Telegraf } from "telegraf";
import { toHTML, toMarkdownV2 } from "@telegraf/entity";

export default function (message, type, channel_id) {
  if (type == "alert") {
    alert(message);
  }
  if (type == "telegram") {
    let CHANNEL_ID = channel_id ? channel_id : "-1001967555467";
    let BOT_TOKEN = "6271843557:AAEQ6ifCSa5En8lmtWvJ3kPYU-cTPYK6XmE";
    const bot = new Telegraf(BOT_TOKEN);
    bot.telegram.sendMessage(CHANNEL_ID, toHTML({ text: message }));
  }
}
