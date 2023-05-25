import { Client, Contract, Order } from "../index.js";

async function run() {
  let api = new Client({
    host: "127.0.0.1",
    port: 7501,
  });

  // let contract = Contract.stock("AAPL");

  let contract = {
    // conId: 551601609,
    symbol: "MNQ",
    secType: "FUT",
    lastTradeDateOrContractMonth: "20230616",
    exchange: "CME",
    currency: "USD",
  };

  let e = await api.streamMarketData({
    contract: contract,
  });

  console.log("Eeeeeee", e);

  e.on("tick", (eee) => {
    console.log("EEEE", eee);
  });
  // e.on("error", (e) => {
  //   console.log("error");
  //   console.log(e);
  // });

  // let details = await api.getHistoricalTicks({
  //   contract: Contract.stock("AAPL"),
  //   startDateTime: "20200608 11:00:00",
  //   numberOfTicks: 1000,
  //   whatToShow: "TRADES",
  //   useRth: 1,
  // });
  // console.log(details);
}

run()
  .then(() => {
    console.log("finish");
    // process.exit();
  })
  .catch((e) => {
    console.log("failure");
    console.log(e);
    process.exit();
  });
