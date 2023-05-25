import { Client, Contract, Order } from "../index.js";
import Logger from "./logger.js";
import IP from "ip";

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

  let clientData = new Client({
    host: "127.0.0.1",
    port: 7501,
  });

  // await clientOrigin.connect();
  // await clientData.connect();
  // await clientConsumer.connect();

  let pricePercent = 5;

  let compareStates = async (master, slave) => {
    console.log("ENTER_COMPARE");
    Object.keys(master).forEach(async (key) => {
      if (
        master[key].contract.symbol[0] == "M" ||
        master[key].contract.symbol == "USD"
      )
        return;
      let symbolSlave = "M" + master[key].contract.symbol;
      let currContract = {
        symbol: symbolSlave,
        secType: master[key].contract.secType || "FUT",
        lastTradeDateOrContractMonth:
          master[key].contract.lastTradeDateOrContractMonth,
      };
      let contractDetails = await clientOrigin.getContractDetails(currContract);
      let contract = {};
      if (contractDetails.length) {
        let contractTemplate = contractDetails[0].contract;
        contract = {
          symbol: contractTemplate.symbol,
          secType: contractTemplate.secType,
          lastTradeDateOrContractMonth:
            contractTemplate.lastTradeDateOrContractMonth,
          exchange: contractTemplate.exchange || "CME",
          currency: contractTemplate.currency || "USD",
        };

        console.log("CONTRACT1", contract);

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

          let averagePrice =
            master[key].avgCost / master[key].contract.multiplier;

          try {
            console.log("CONTRACT2", contract);

            var currentMarketData = await clientData.getMarketDataSnapshot({
              contract: contract,
            });

            console.log("SNAPSHOT", currentMarketData);

            if (
              Object.keys(currentMarketData).length == 0 ||
              currentMarketData.bid == -1
            ) {
              Logger("Snapshot error", "telegram");
              return;
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
                return;
              } else {
                order = Order.market({
                  action:
                    master[key].position > objSlave.position ? "BUY" : "SELL",
                  totalQuantity: Math.abs(
                    master[key].position - objSlave.position
                  ),
                });
              }

              console.log("SNAPSHOT", currentMarketData, averagePrice);
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

        Logger(
          `Symbol : ${contract.symbol}\nPrice : ${
            currentMarketData.last
          }\nQuantity : ${
            order.totalQuantity
          } \nTime : ${new Date().toLocaleString()} \nOrder call : ${
            order.action
          }
          `,
          "telegram",
          "-1001568215679"
        );
        clientConsumer.placeOrder({ contract, order });
      }
    });
  };

  setInterval(() => {
    Logger(`Application live on : ${IP.address()}`, "telegram");
  }, 60000);

  setInterval(async () => {
    try {
      await clientOrigin.connect();
      await clientData.connect();
      if (!StateManager.state.isMasterConnected) {
        Logger("Connected to port : 7497", "telegram");
        StateManager.state.isMasterConnected = true;
      }
      StateManager.errors.masterConnection = false;

      await clientConsumer.connect();
      if (!StateManager.state.isSlaveConnected) {
        Logger("Connected to port : 7500", "telegram");
        StateManager.state.isSlaveConnected = true;
      }
      StateManager.errors.slaveConnection = false;
      console.log("ONE");
      let positionsMaster = await clientOrigin.getPositions();
      let positionsSlave = await clientConsumer.getPositions();
      console.log("TWO");
      compareStates(positionsMaster, positionsSlave);
    } catch (err) {
      // HANDLE CONNECTION ERROR
      // MASTER ERROR
      if (err.code == "ECONNREFUSED" && err.port == 7497) {
        if (!StateManager.errors.masterConnection) {
          Logger(`Connection lost on port :: ${err.port}`, "alert");
          Logger(`Connection lost on port :: ${err.port}`, "telegram");
        }

        StateManager.errors.masterConnection = true;
        StateManager.state.isMasterConnected = false;
      }

      // SLAVE ERROR
      if (err.code == "ECONNREFUSED" && err.port == 7500) {
        if (!StateManager.errors.slaveConnection) {
          Logger(`Connection lost on port :: ${err.port}`, "alert");
          Logger(`Connection lost on port :: ${err.port}`, "telegram");
        }

        StateManager.errors.slaveConnection = true;
        StateManager.state.isSlaveConnected = false;
      }
    }
  }, 5000);
}

run()
  .then(() => {})
  .catch((e) => {
    console.log("failure");
    console.log(e);
    // process.exit();
  });
