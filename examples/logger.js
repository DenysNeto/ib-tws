// chat id (order calls) => -1001568215679

import alert from "alert";
import { Telegraf } from "telegraf";

export function Logger(message, type, channel_id, callback, callback_err) {
  if (type == "alert") {
    alert(message);
  }
  if (type == "telegram") {
    let CHANNEL_ID =
      channel_id && channel_id != null ? channel_id : "-1001967555467";
    let BOT_TOKEN = "6271843557:AAEQ6ifCSa5En8lmtWvJ3kPYU-cTPYK6XmE";
    const bot = new Telegraf(BOT_TOKEN);
    bot.telegram
      .sendMessage(CHANNEL_ID, message)
      .then((msg) => {
        if (callback) {
          callback(msg);
        }
      })
      .catch((err) => {
        callback_err(err);
      });
  }
}

export function LoggerReply(
  message,
  message_id,
  channel_id,
  callback,
  callback_err
) {
  let CHANNEL_ID =
    channel_id && channel_id != null ? channel_id : "-1001638761874";
  let BOT_TOKEN = "6271843557:AAEQ6ifCSa5En8lmtWvJ3kPYU-cTPYK6XmE";
  const bot = new Telegraf(BOT_TOKEN);

  bot.telegram
    .sendMessage(CHANNEL_ID, message, { reply_to_message_id: message_id })
    .then((msg) => {
      if (callback) {
        callback(msg);
      }
    })
    .catch((err) => {
      console.log(err);
    });
}
