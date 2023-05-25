import { Client, Contract, Order } from "../index.js";

async function run() {
  let api = new Client({
    host: "127.0.0.1",
    port: 7501,
  });

  let contract = {
    symbol: "NQ",
    secType: "FUT",
    exchange: "CME",
    lastTradeDateOrContractMonth: "20230616",
  };

  let details = await api.getHistoricalData({
    contract: contract,
    //contract: Contract.stock("AAPL"),
    endDateTime: "20160127-23:59:59",
    duration: "3 D",
    barSizeSetting: "1 hour",
    whatToShow: "TRADES",
    useRth: 1,
    formatDate: 1,
  });
  console.log(details);
}

run()
  .then(() => {
    console.log("finish");
    process.exit();
  })
  .catch((e) => {
    console.log("failure");
    console.log(e);
    process.exit();
  });
