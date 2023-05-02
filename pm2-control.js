import pm2 from "pm2";
import Logger from "./examples/logger.js";

pm2.connect(false, function (err) {
  if (err) {
    console.error("PM2_CONNECT_ERROR", err);
    // process.exit(2);
  }

  pm2.start(
    {
      script: "examples/exampledenis.js",
      name: "app",
    },
    function (err, apps) {
      // TODO add logger
      Logger("PM2 start", "telegram");
      if (err) {
        console.error("PM2_START_ERROR", err.message);
        Logger("PM2 start error:" + err.message, "telegram");
        Logger("PM2 disconnect" + err.message, "telegram");
        return pm2.disconnect();
      }
      pm2.list((err, list) => {
        console.log(err, list);
        pm2.restart("api", (err, proc) => {
          // Disconnects from PM2
          // TODO add logger
          console.error("PM2_START_ERROR", err);
          pm2.disconnect();
        });
      });
    }
  );
});

pm2.launchBus(function (err, pm2_bus) {
  pm2_bus.on("process:msg", function (packet) {
    console.log("MSG:::", packet);
  });
});
