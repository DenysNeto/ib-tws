import { Client, Contract, Order } from "../index.js";

async function run() {
  let api = new Client({
    host: "127.0.0.1",
    port: 7498,
  });
  // console.log("aaaa", {
  //   conId: 551601533,
  //   symbol: "MNQ",
  //   secType: "FUT",
  //   lastTradeDateOrContractMonth: "20230616",
  //   strike: 0,
  //   right: "?",
  //   multiplier: "20",
  //   exchange: "CME",
  //   currency: "USD",
  //   localSymbol: "NQM3",
  //   tradingClass: "MNQ",
  //   comboLegsDescrip: "",
  // });
  try {
    // {

    //   symbol: 'MNQ',
    //   secType: 'FUT',
    //   lastTradeDateOrContractMonth: '20230616',
    //   strike: 0,
    //   right: '?',
    //   multiplier: '2',
    //   exchange: 'CME',
    //   currency: 'USD',
    //   localSymbol: 'MNQM3',
    //   tradingClass: 'MNQ',
    //   comboLegsDescrip: ''
    // }

    // NQ

    // {
    //       conId: 551601533,
    //       symbol: 'NQ',
    //       secType: 'FUT',
    //       lastTradeDateOrContractMonth: '20230616',
    //       strike: 0,
    //       right: '?',
    //       multiplier: '20',
    //       exchange: 'CME',
    //       currency: 'USD',
    //       localSymbol: 'NQM3',
    //       tradingClass: 'NQ',
    //       comboLegsDescrip: ''
    //     }

    // MNQ

    // {
    //   //  conId: 551601609,
    //   symbol: "MNQ",
    //   secType: "FUT",
    //   lastTradeDateOrContractMonth: "20230616",
    //   strike: 0,
    //   right: "?",
    //   multiplier: "2",
    //   exchange: "CME",
    //   currency: "USD",
    //   localSymbol: "MNQM3",
    //   tradingClass: "MNQ",
    //   comboLegsDescrip: "",
    // }

    let details = await api.getContractDetails({
      //  conId: 551601533,
      symbol: "NQ",
      secType: "FUT",
      lastTradeDateOrContractMonth: "20230616",
      // exchange: "CME",
      // currency: "USD",

      // strike: 0,
      // right: "?",

      // localSymbol: "NQM3",
      // tradingClass: "NQ",
      // comboLegsDescrip: "",
    });
    // let details2 = await api.getContractDetails({
    //   //  conId: 551601609,
    //   symbol: "MNQ",
    //   secType: "FUT",
    //   lastTradeDateOrContractMonth: "20230616",
    //   strike: 0,
    //   right: "?",
    //   multiplier: "2",
    //   exchange: "CME",
    //   currency: "USD",
    //   localSymbol: "MNQM3",
    //   tradingClass: "MNQ",
    //   comboLegsDescrip: "",
    // });

    console.log("DETAILS", details);
  } catch (err) {
    console.log("ERR", err);
  }
}

run()
  .then(() => {
    console.log("finish");
    // process.exit();
  })
  .catch((e) => {
    console.log("failure");
    console.log(e);
    //process.exit();
  });
