import alert from "alert";
import { Telegraf } from "telegraf";

export default function (message, type, channel_id) {
  if (type == "alert") {
    alert(message);
  }
  if (type == "telegram") {
    let CHANNEL_ID = channel_id ? channel_id : "-1001967555467";
    let BOT_TOKEN = "6271843557:AAEQ6ifCSa5En8lmtWvJ3kPYU-cTPYK6XmE";
    const bot = new Telegraf(BOT_TOKEN);
    bot.telegram.sendMessage(CHANNEL_ID, message);
  }
}
