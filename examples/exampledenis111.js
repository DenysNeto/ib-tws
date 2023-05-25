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

  // TODO CHECK IF NEED
  // await new Promise(function (accept, _) {
  //   setTimeout(function () {
  //     accept();
  //   }, 2000);
  // });

  let compareStates = async (master, slave) => {
    console.log("COMPARE_STATE");
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

      // TODO FINISH

      let currentOpenedOrders = await clientConsumer.getAllOpenOrders();
      //console.log("RESULT_ORDRS", currentOpenedOrders);

      let contractDetails = await clientOrigin.getContractDetails(currContract);
      console.log("GET_CONTRACT_DETAILS", contractDetails);
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
          // CASE WHEN EQUAL
          if (master[key].position - objSlave.position == 0) {
            return;
          }

          // CASE WHEN PRICE CHANGED
          // TODO FINISH

          let averagePrice =
            master[key].avgCost /
            master[key].position /
            master[key].contract.multiplier;

          // ?

          let currentMarketData = await api.getMarketDataSnapshot({
            contract: contract,
          });

          console.log("SNAPSHOT", currentMarketData, averagePrice);

          order = Order.market({
            action: master[key].position > objSlave.position ? "BUY" : "SELL",
            totalQuantity: Math.abs(master[key].position - objSlave.position),
          });
        } else {
          if (Math.abs(master[key].position) == 0) {
            return;
          }
          order = Order.market({
            action: master[key].position > 0 ? "BUY" : "SELL",
            totalQuantity: Math.abs(master[key].position),
          });
        }

        // TODO add msg to toelegram bot  {contract ,  order}
        // create template msg  and you change
        // delete  "M"  from beggining in  contract.symbol

        clientConsumer.placeOrder({ contract, order });
      }
    });
  };

  // setInterval(() => {
  //   Logger("Application live on :" + IP.address(), "telegram");
  // }, 60000);

  setInterval(async () => {
    try {
      await clientOrigin.connect();
      if (!StateManager.state.isMasterConnected) {
        Logger("Connected to port : " + 7497, "telegram");
        StateManager.state.isMasterConnected = true;
      }
      StateManager.errors.masterConnection = false;

      await clientConsumer.connect();
      if (!StateManager.state.isSlaveConnected) {
        Logger("Connected to port : " + 7500, "telegram");
        StateManager.state.isSlaveConnected = true;
      }
      StateManager.errors.slaveConnection = false;

      let positionsMaster = await clientOrigin.getPositions();
      let positionsSlave = await clientConsumer.getPositions();
      console.log("POSITION MASTER", positionsMaster);

      compareStates(positionsMaster, positionsSlave);
    } catch (err) {
      // HANDLE CONNECTION ERROR
      // MASTER ERROR
      if (err.code == "ECONNREFUSED" && err.port == 7497) {
        if (!StateManager.errors.masterConnection) {
          Logger("Connection lost on port :: " + err.port, "alert");
          Logger("Connection lost on port :: " + err.port, "telegram");
        }

        StateManager.errors.masterConnection = true;
        StateManager.state.isMasterConnected = false;
      }

      // SLAVE ERROR
      if (err.code == "ECONNREFUSED" && err.port == 7500) {
        if (!StateManager.errors.slaveConnection) {
          Logger("Connection lost on port :: " + err.port, "alert");
          Logger("Connection lost on port :: " + err.port, "telegram");
        }

        StateManager.errors.slaveConnection = true;
        StateManager.state.isSlaveConnected = false;
      }
    }
  }, 3000);
}

run()
  .then(() => {})
  .catch((e) => {
    console.log("failure");
    console.log(e);
    // process.exit();
  });
