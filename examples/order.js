import { Client, Contract, Order } from "../index.js";
import { exec } from "child_process";

import fs from "fs";

console.log("START_ORDER");
let api = new Client({
  host: "127.0.0.1",
  port: 7500,
});

setInterval(async () => {
  // console.log("INTERVAL");

  await api.connect();
  let ordersTest = await api.getAllOpenOrders();
  let test2 = await api.getOpenOrders();
  console.log("TEST1", test2.length);
  if (ordersTest.length) {
    let resultBefore = fs.readFile(
      "C:/Users/Denis/ib-tws-api/examples/output/originalOrders.txt",
      "utf8",
      (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(data);
      }
    );

    console.log("TEST2", test2.length);

    let content = resultBefore + JSON.stringify(ordersTest);
    fs.writeFile(
      "C:/Users/Denis/ib-tws-api/examples/output/originalOrders.txt",
      content,
      (err) => {
        if (err) {
          console.error(err);
        }
      }
    );
  }
}, 10);

// TEST
// try {
//   console.log("API_0", api);
//   await api.connect();
//   console.log("API", api, api._connected);
//   if (api._connected == false) {
//     console.log("API_IS_FALSE", ordersTest);
//   } else {
//     setInterval(async () => {
//       let ordersTest = await api.getAllOpenOrders();
//       // let positions = await api.getPositions();
//       // console.log("Positions");
//       // console.log(positions);
//       let content = JSON.stringify(ordersTest);
//       fs.writeFile(
//         "C:/Users/Denis/ib-tws-api/examples/output/createdOrders.txt",
//         content,
//         (err) => {
//           if (err) {
//             console.error(err);
//           }
//           // file written successfully
//         }
//       );
//       console.log("TEST:", ordersTest);
//     }, 10);
//   }
// } catch (err) {
//   // exec("node aaa.js", (error, stdout, stderr) => {
//   //   if (error) {
//   //     console.log(`error: ${error.message}`);
//   //     return;
//   //   }
//   //   if (stderr) {
//   //     console.log(`stderr: ${stderr}`);
//   //     return;
//   //   }
//   //   console.log(`stdout: ${stdout}`);
//   // });
//   console.log("RRRRRR", err);
// }

async function run() {
  new Client({
    host: "127.0.0.1",
    port: 7500,
  });

  try {
    let api = new Client({
      host: "127.0.0.1",
      port: 7500,
    });
  } catch (err) {
    console.log("ERROR_CONNECT", err);
  }

  // let order1 = await api.placeOrder({
  //   contract: Contract.stock("AAPL"),
  //   order: Order.market({
  //     action: "BUY",
  //     totalQuantity: 1,
  //   }),
  // });

  // {
  //     symbol: "MNQ",
  //     secType: "FUT",
  //     lastTradeDateOrContractMonth: "20230616",
  //     tradingClass: "MNQ",
  //     localSymbol: "MNQM3",
  //   }

  // setInterval(async () => {
  //   let ordersTest = await api.getAllOpenOrders();
  //   console.log("TEST:", ordersTest);
  // }, 100);

  return;
  let order2 = await api.placeOrder({
    contract: {
      symbol: "MGC",
      secType: "FUT",
      lastTradeDateOrContractMonth: "20230628",
      exchange: "COMEX",
      currency: "USD",
    },
    order: {
      orderType: "MKT",
      transmit: true,
      goodAfterTime: "",
      goodTillDate: "",
      action: "SELL",
      totalQuantity: 1,
    },
  });

  console.log("ORDER_2", order2);

  // Check open orders
  //api.reqGlobalCancel();

  console.log("waiting a bit. listen to orderStatus events on production");
  await new Promise(function (accept, _) {
    setTimeout(function () {
      accept();
    }, 5000);
  });

  let orders = await api.getAllOpenOrders();
  console.log("Opened orders", orders);
  // console.log(orders);

  // Cancel orders after 5 seconds.
  // setTimeout(async () => {
  //   console.log("cancelling");
  //   let reason1 = await api.cancelOrder(order1);
  //   console.log(reason1);

  //   let reason2 = await api.cancelOrder(order2);
  //   console.log(reason2);

  //   //    ib.reqAllOpenOrders();
  // }, 5000);
}

// run()
//   .then(() => {})
//   .catch((e) => {
//     console.log("failure");
//     console.log(e);
//     process.exit();
//   });
