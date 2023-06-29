import { Client, Contract, Order } from "../index.js";
import IP from "ip";
import { spawn } from "child_process";
import { Logger, LoggerReply } from "./logger.js";
import fs from "fs";
import path from "path";

let __dirname = path.resolve(path.dirname(""));
__dirname = __dirname.includes("examples")
  ? __dirname
  : __dirname + "/examples";

process.env.NODE_DEBUG = "ib-tws-api";

let StateManager = {
  errors: {
    masterConnection: false,
    slaveConnection: false,
  },
  state: {
    isMasterConnected: false,
    isSlaveConnected: false,
    lastRequestOrder: {},
  },
};

function spawnScript(script_name, callback, cb_err) {
  let largeDataSet;
  console.log("SPWN_", largeDataSet);
  const python = spawn("python", [script_name], { windowsHide: true });

  python.stdout.on("data", function (data) {
    largeDataSet = data.toString();
    console.log("SPWN_DATA", largeDataSet);
    if (largeDataSet.length > 2 && !largeDataSet.startsWith("[]")) {
      try {
        callback(JSON.parse(largeDataSet));
      } catch (err) {
        cb_err(err);
      }
    }
  });

  python.on("close", (code) => {
    // callback(largeDataSet)
  });
}
function sendOpenedOrUpdated(data) {
  data.forEach((order, index) => {
    if (order.quantity && Number.MAX_VALUE == order.quantity) {
      let str = order.quantity.toString();
      order.quantity = str.substring(0, 1);
    }

    if (!sendedId[order.orderId]) {
      sendedId[order.orderId] = { status: "Opened", order };

      Logger(
        `
      ▫️ Order ID : ${order.orderId} ▫️
      Symbol : ${order.symbol}
      Quantity : ${Math.floor(+order.quantity)}
      Order call : ${order.action} ${order.orderType || ""} ${order.price}
      Time : ${order.time}
       `,
        "telegram",
        "-1001568215679",
        (msg) => {
          sendedId[order.orderId].message = msg.message_id;
          console.log("SENDED_MSG", msg);
        }
      );
    } else {
      if (sendedId[order.orderId].order.price != order.price) {
        LoggerReply(
          `
          ▫️ Order ID : ${order.orderId} ▫️
          Order Updated 🔔
          New Limit:  ${order.price}`,
          sendedId[order.orderId].message,
          "-1001568215679",
          undefined,
          (err) => {
            console.log(err);
          }
        );
        sendedId[order.orderId].order = order;
        sendedId[order.orderId].status = "Updated";
      }
    }
  });
}
function sendCancelledOrExecuted(data) {
  data.forEach((order, index) => {
    if (!sendedId[order.orderId] && order.status && order.quantity > 0) {
      sendedId[order.orderId] = { status: "Executed", order };
      Logger(
        `
      ▫️ Order ID : ${order.orderId} ▫️
      Execution ID : ${order.execId}
      Symbol : ${order.symbol}
      Price : ${order.price}
      Quantity : ${Math.floor(+order.quantity)}
      Order call : ${order.action} ${order.orderType || ""}
      Time : ${order.time}
       `,
        "telegram",
        "-1001568215679",
        (msg) => {
          sendedId[order.orderId].message = msg.message_id;
          console.log("SENDED_MSG", msg);
        }
      );
    } else if (
      sendedId[order.orderId] &&
      sendedId[order.orderId].status != "Executed" &&
      sendedId[order.orderId].status != "Cancelled"
    ) {
      if (order.status == "Filled") {
        sendedId[order.orderId].status = "Executed";
        if (sendedId[order.orderId].order.price != order.price) {
          sendedId[order.orderId].order.price = order.price;
          LoggerReply(
            `
               ▫️ Order ID : ${order.orderId} ▫️
               Order Updated 🔔
               Execution : ${order.price}
              `,
            sendedId[order.orderId].message,
            "-1001568215679",
            undefined,
            (err) => {
              console.log(err);
            }
          );
        } else {
          LoggerReply(
            `
               ▫️ Order ID : ${order.orderId} ▫️
               Order Executed  ✅
              `,
            sendedId[order.orderId].message,
            "-1001568215679",
            undefined,
            (err) => {
              console.log(err);
            }
          );
        }
      }
      if (order.status == "Cancelled") {
        sendedId[order.orderId].status = "Cancelled";
        LoggerReply(
          `
             ▫️ Order ID : ${order.orderId} ▫️
             Order Cancelled ⛔️
            `,
          sendedId[order.orderId].message,
          "-1001568215679",
          undefined,
          (err) => {
            console.log(err);
          }
        );
      }
    }
  });
}

async function run() {
  // TODO CHECK IF NEED
  // Logger("Application run !", "telegram");

  let clientOrigin = new Client({
    host: "127.0.0.1",
    port: 7497,
  });
  // TODO ARRAY CONSUMERS
  let clientConsumer = new Client({
    host: "127.0.0.1",
    port: 7500,
  });

  // let clientData = new Client({
  //   host: "127.0.0.1",
  //   port: 7501,
  // });

  // await clientOrigin.connect();
  // await clientData.connect();
  // await clientConsumer.connect();

  let pricePercent = 5;

  let compareStates = async (master, slave) => {
    console.log("MASTER", master);
    Object.keys(master).forEach(async (key) => {
      let symbolSlave = "M" + master[key].contract.symbol;
      let currContract = {
        symbol: symbolSlave,
        secType: master[key].contract.secType || "FUT",
        lastTradeDateOrContractMonth:
          master[key].contract.lastTradeDateOrContractMonth,
      };
      let contractDetails = undefined;
      try {
        contractDetails = await clientOrigin.getContractDetails(currContract);
      } catch (err) {
        console.log("ERR_Contract_details", err.message, currContract);
      }
      console.log("AFTER", master[key].contract.symbol, contractDetails);
      let contract = {};
      if (contractDetails && contractDetails.length) {
        let contractTemplate = contractDetails[0].contract;
        contract = {
          symbol: contractTemplate.symbol,
          secType: contractTemplate.secType,
          lastTradeDateOrContractMonth:
            contractTemplate.lastTradeDateOrContractMonth,
          exchange: contractTemplate.exchange || "CME",
          currency: contractTemplate.currency || "USD",
        };

        // BUILD ORDR
        let objSlave = undefined;
        Object.keys(slave).forEach((key) => {
          if (
            slave[key].contract.symbol == contractTemplate.symbol &&
            slave[key].contract.lastTradeDateOrContractMonth ==
              contractTemplate.lastTradeDateOrContractMonth &&
            slave[key].contract.secType == contractTemplate.secType
          ) {
            objSlave = slave[key];
          }
        });

        let order = {};
        if (objSlave) {
          if (master[key].position - objSlave.position == 0) {
            return;
          }

          console.log("MASTER_KEY", master[key]);

          let averagePrice =
            master[key].avgCost / master[key].contract.multiplier;

          try {
            var currentMarketData = {};
            //  await clientData.getMarketDataSnapshot({
            //   contract: contract,
            // });

            if (
              Object.keys(currentMarketData).length == 0 ||
              currentMarketData.bid == -1
            ) {
              Logger("Snapshot error", "telegram");
              //return;
            }
            if (currentMarketData.last > 0 && averagePrice > 0) {
              let priceFromPercent = (averagePrice * pricePercent) / 100;
              let condOpenOrder = true;

              //Case BUY
              if (
                master[key].position > objSlave.position &&
                currentMarketData.last > averagePrice + priceFromPercent
              ) {
                condOpenOrder = false;
              }
              //Case SELL
              if (
                master[key].position < objSlave.position &&
                currentMarketData.last < averagePrice - priceFromPercent
              ) {
                condOpenOrder = false;
              }

              if (!condOpenOrder) {
                Logger(
                  `Cannot open order. Price changed more than ${pricePercent.toString()}%`,
                  "telegram",
                  "-1001568215679"
                );
              } else {
                order = Order.market({
                  action:
                    master[key].position > objSlave.position ? "BUY" : "SELL",
                  totalQuantity: Math.abs(
                    master[key].position - objSlave.position
                  ),
                });
              }
            } else {
              order = Order.market({
                action:
                  master[key].position > objSlave.position ? "BUY" : "SELL",
                totalQuantity: Math.abs(
                  master[key].position - objSlave.position
                ),
              });
            }
          } catch (err) {
            Logger(`Catched snapshot error`, "telegram");
          }
        } else {
          if (Math.abs(master[key].position) == 0) {
            return;
          }
          order = Order.market({
            action: master[key].position > 0 ? "BUY" : "SELL",
            totalQuantity: Math.abs(master[key].position),
          });
        }

        clientConsumer.placeOrder({ contract, order });
      }
    });
  };

  // setInterval(() => {
  //   Logger(`Application live on : ${IP.address()}`, "telegram");
  // }, 60000);

  setInterval(async () => {
    try {
      await clientOrigin.connect();
      await clientConsumer.connect();
      // await clientData.connect();
      if (!StateManager.state.isMasterConnected) {
        //  Logger("Connected to port : 7497", "telegram");
        StateManager.state.isMasterConnected = true;
      }
      StateManager.errors.masterConnection = false;

      if (!StateManager.state.isSlaveConnected) {
        //  Logger("Connected to port : 7500", "telegram");
        StateManager.state.isSlaveConnected = true;
      }
      StateManager.errors.slaveConnection = false;
      let positionsMaster = await clientOrigin.getPositions();
      let positionsSlave = await clientConsumer.getPositions();
      compareStates(positionsMaster, positionsSlave);
    } catch (err) {
      console.log(err);
      // HANDLE CONNECTION ERROR
      // MASTER ERROR
      if (err.code == "ECONNREFUSED" && err.port == 7497) {
        if (!StateManager.errors.masterConnection) {
          //  Logger(`Connection lost on port :: ${err.port}`, "alert");
          //  Logger(`Connection lost on port :: ${err.port}`, "telegram");
        }

        StateManager.errors.masterConnection = true;
        StateManager.state.isMasterConnected = false;
      }

      // SLAVE ERROR
      if (err.code == "ECONNREFUSED" && err.port == 7500) {
        if (!StateManager.errors.slaveConnection) {
          //  Logger(`Connection lost on port :: ${err.port}`, "alert");
          //  Logger(`Connection lost on port :: ${err.port}`, "telegram");
        }

        StateManager.errors.slaveConnection = true;
        StateManager.state.isSlaveConnected = false;
      }
    }
  }, 3000);
}

// TODO UNCOMMENT
run()
  .then(() => {})
  .catch((e) => {
    console.log("failure");
    console.log(e);
    // process.exit();
  });

let data = fs.readFileSync(
  __dirname + "/sendedMessages.txt",
  "utf8",
  (err, data) => {
    if (err) {
      console.log("Err sendedMessage", err);
    }
  }
);
if (data == null || data == "" || data == undefined) {
  data = "{}";
}

let sendedId = JSON.parse(data);

setInterval(() => {
  console.log("INTERVAL_RUN");
  // getAllOpenedOrders
  spawnScript(
    __dirname + "/getAllOpenedOrders.py",
    (data) => {
      console.log("DATA_opened", data);
      if (data && data.length > 0) {
        sendOpenedOrUpdated(data);
      }
    },
    (err) => {
      if (err) {
        console.log("OPENED_ORDERS", err.message);
      }
    }
  );

  // getAllCompletedOrders
  spawnScript(
    __dirname + "/getAllCompletedOrders.py",
    (data) => {
      console.log("DATA_completed", data);
      sendCancelledOrExecuted(data);
    },
    (err) => {
      if (err) {
        console.log("COMPLETED_ORDERS", err.message);
      }
    }
  );
  console.log("SENDED_ID", sendedId);
  fs.writeFileSync(
    __dirname + "/sendedMessages.txt",
    JSON.stringify(sendedId),
    (err) => {
      if (err) {
        console.log("WRITE_FILE", err.message);
      }
    }
  );
}, 4000);
