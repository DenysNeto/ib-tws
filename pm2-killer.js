import pm2 from "pm2";

pm2.delete("App", (err, process) => {
  console.log("PROCESSS_DELETED");
  pm2.disconnect();
});
