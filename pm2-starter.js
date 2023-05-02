import pm2 from "pm2";
import Logger from "./examples/logger.js";

pm2.connect(false, function (err) {
  if (err) {
    console.error("PM2_CONNECT_ERROR", err);
    Logger("PM2 connect error:" + err.message, "telegram");
    process.exit(2);
  }

  pm2.start(
    {
      script: "examples/exampledenis.js",
      name: "App",
    },
    function (err, apps) {
      // TODO add logger
      Logger("PM2 start", "telegram");
      if (err) {
        console.error("PM2_START_ERROR", err.message);
        Logger("PM2 start error:" + err.message, "telegram");
        return pm2.disconnect();
      }
      pm2.list((err, list) => {
        console.log(err, list);
        pm2.restart("api", (err, proc) => {
          pm2.disconnect();
        });
      });
    }
  );
});
