import pm2 from "pm2";

pm2.connect(false, function (err) {
  if (err) {
    process.exit(2);
  }
  pm2.start(
    {
      script: "examples/exampledenis.js",
      name: "App",
    },
    function (err, apps) {
      if (err) {
        return pm2.disconnect();
      }
      pm2.list((err, list) => {
        pm2.restart("api", (err, proc) => {
          pm2.disconnect();
        });
      });
    }
  );
});
pm2.launchBus(function (err, pm2_bus) {
  pm2_bus.on("process:msg", function (packet) {});
});
