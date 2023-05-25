import { Client, Contract } from "../index.js";

async function run() {
  let api = new Client({
    host: "127.0.0.1",
    port: 7501,
  });

  let contract = {
    symbol: "MNQ",
    secType: "FUT",
    exchange: "CME",
    lastTradeDateOrContractMonth: "20230616",
  };

  await api.connect();

  let ticker = await api.getMarketDataSnapshot({
    contract: contract,
  });

  console.log("TICKER", ticker);
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
