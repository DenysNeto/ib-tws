import { exec } from "child_process";
import alert from "alert";
import { Telegraf } from "telegraf";

console.log("AAAAAAAAAAA");

let Logger = function (message, type, channel_id) {
  if (type == "alert") {
    alert(message);
  }
  if (type == "telegram") {
    let CHANNEL_ID = channel_id ? channel_id : "-1001967555467";
    let BOT_TOKEN = "6271843557:AAEQ6ifCSa5En8lmtWvJ3kPYU-cTPYK6XmE";
    const bot = new Telegraf(BOT_TOKEN);
    bot.telegram.sendMessage(CHANNEL_ID, message);
  }
};

Logger("ALERT!!!!", "alert");

// setInterval(() => {
//   Logger("ALERT!!!!", "telegram");
// }, 1000);

// exec("node order.js", (error, stdout, stderr) => {
//   if (error) {
//     console.log(`error: ${error.message}`);
//     return;
//   }
//   if (stderr) {
//     console.log(`stderr: ${stderr}`);
//     return;
//   }
//   console.log(`stdout: ${stdout}`);
// });
