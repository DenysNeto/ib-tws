import pm2 from "pm2";
import Logger from "./examples/logger.js";

pm2.delete("App", (err, process) => {
  if (err) {
    Logger("PM2 stop error:" + err.message, "telegram");
  }
  Logger("PM2 stop", "telegram");
  pm2.disconnect();
});
