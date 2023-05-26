import { Client, Contract, Order } from "../index.js";
import fs from "fs";
import alert from "alert";
import { Telegraf } from "telegraf";

let Logger = function (message, type, channel_id) {
  if (type == "alert") {
    alert(message);
  }
  if (type == "telegram") {
    let CHANNEL_ID = channel_id ? channel_id : "-1001967555467";
    let BOT_TOKEN = "6271843557:AAEQ6ifCSa5En8lmtWvJ3kPYU-cTPYK6XmE";
    const bot = new Telegraf(BOT_TOKEN);
    bot.telegram.sendMessage(CHANNEL_ID, message);
  }
};

let StateManager = {
  errors: {
    masterConnection: false,
    slaveConnection: false,
  },
  state: {
    isMasterConnected: false,
    isSlaveConnected: false,
  },
};

async function run() {
  Logger("Application run !", "telegram");

  let clientOrigin = new Client({
    host: "127.0.0.1",
    port: 7497,
  });
  // TODO ARRAY CONSUMERS
  let clientConsumer = new Client({
    host: "127.0.0.1",
    port: 7500,
  });

  await new Promise(function (accept, _) {
    setTimeout(function () {
      accept();
    }, 2000);
  });

  let compareStates = async (master, slave) => {
    let oredersToAdd = [];
    Object.keys(master).forEach(async (key) => {
      if (master[key].contract.symbol[0] == "M") return;
      let symbolSlave = "M" + master[key].contract.symbol;
      let currContract = {
        symbol: symbolSlave,
        secType: "FUT",
        lastTradeDateOrContractMonth:
          master[key].contract.lastTradeDateOrContractMonth,
      };
      console.log("aaaa", currContract);
      let contractDetails = await clientOrigin.getContractDetails(currContract);
      console.log("contractDetails", contractDetails);
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
          if (master[key].position - objSlave.position == 0) {
            return;
          }

          order = Order.market({
            action: master[key].position > objSlave.position ? "BUY" : "SELL",
            totalQuantity: Math.abs(master[key].position - objSlave.position),
          });
        } else {
          if (Math.abs(master[key].position == 0)) {
            return;
          }
          order = Order.market({
            action: master[key].position > 0 ? "BUY" : "SELL",
            totalQuantity: Math.abs(master[key].position),
          });
        }

        console.log("RESULT___", { contract, order });

        oredersToAdd.push({ contract, order });

        clientConsumer.placeOrder({ contract, order });
      }
    });
  };

  setInterval(() => {
    Logger("Application ping", "telegram");
  }, 60000);

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

      // TODO debug purpose
      // let contentMaster = JSON.stringify(positionsMaster);
      // let contentSlave = JSON.stringify(positionsSlave);
      // fs.writeFileSync(
      //   "C:/Users/Denis/ib-tws-api/examples/output/masterState.txt",
      //   contentMaster,
      //   (err) => {
      //     if (err) {
      //       console.error(err);
      //     }
      //   }
      // );
      // fs.writeFileSync(
      //   "C:/Users/Denis/ib-tws-api/examples/output/slaveState.txt",
      //   contentSlave,
      //   (err) => {
      //     if (err) {
      //       console.error(err);
      //     }
      //   }
      // );
      compareStates(positionsMaster, positionsSlave);
    } catch (err) {
      console.log("TTTT", err.code, err.port);
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
  }, 5000);

  // COMPARE STATES AND ADD ORDERS

  return;

  // <===========================================================================>

  // TODO REMOVE AFTER
  // EXECUTION FLOW

  // INITIAL ORDERS
  let ordersOrigin = await clientOrigin.getAllOpenOrders();
  let ordersConsumer = await clientConsumer.getAllOpenOrders();

  let OrdersManager = {
    ordersOrigin: ordersOrigin,
  };

  let newOrdersDetected = (newOrders) => {
    let ordersToExecute = [];
    newOrders.forEach((el) => {
      console.log("ORDR_STATE", el);
      // if (el.orderState.status != "Submitted") {
      //   return;
      // }
      let index = OrdersManager.ordersOrigin.findIndex((elInner) => {
        // console.log(
        //   "RESULT!!",
        //   elInner.order.permId,
        //   el.order.permId,
        //   elInner.order.permId == el.order.permId
        // );
        return elInner.order.permId == el.order.permId;
      });

      if (index == -1) {
        console.log("NEW_ITEM");
        ordersToExecute.push(el);
      }
    });
    OrdersManager.ordersOrigin = newOrders;
    // OrdersManager.ordersOrigin = newOrders.filter(
    //   (order) => order.orderState.status == "Submitted"
    // );
    return ordersToExecute;
  };

  // TODO WHAT DATA IS NEEDED
  let openOrder = async (orderData) => {
    let contract = undefined;
    let order = undefined;
    // SERT COINTRACT
    if (orderData.contract.secType == "FUT") {
      contract = Contract.future({
        symbol: orderData.contract.symbol,
        lastTradeDateOrContractMonth:
          orderData.contract.lastTradeDateOrContractMonth,
      });

      contract = {
        symbol: orderData.contract.symbol,
        secType: "FUT",
        lastTradeDateOrContractMonth:
          orderData.contract.lastTradeDateOrContractMonth,
        exchange: orderData.contract.exchange || "CME",
        currency: orderData.contract.currency || "USD",
      };
    } else if (orderData.contract.secType == "STK") {
      contract = Contract.stock(orderData.contract.secType);
    }

    if (orderData.order.orderType == "MKT") {
      order = Order.market({
        action: orderData.order.action,
        totalQuantity: orderData.order.totalQuantity,
      });
    }

    if (orderData.order.orderType == "LMT") {
      order = Order.limit({
        action: orderData.order.action,
        totalQuantity: orderData.order.totalQuantity,
        lmtPrice: orderData.order.lmtPrice,
      });
    }

    clientConsumer.placeOrder({
      contract: contract,
      order: order,
    });
  };

  let checkIsSymbolExists = (contract) => {
    let type = contract.contract.symbol;

    let currContract = null;
    if (contract.contract.secType == "FUT") {
      currContract = {
        symbol: type,
        secType: "FUT",
        lastTradeDateOrContractMonth:
          contract.contract.lastTradeDateOrContractMonth,
      };
    } else if (contract.contract.secType == "STK") {
      currContract = Contract.stock(type);
    }
    return clientConsumer.getContractDetails(currContract);
  };

  let isMicroAvailable = (symbol) => {
    if (symbol[0] == "M") return false;
    else return true;
  };

  let modifyOrderBeforeOpen = async (originalOrder) => {
    if (isMicroAvailable(originalOrder.contract.symbol)) {
      let orderToOpen = {
        contract: {
          symbol: "M" + originalOrder.contract.symbol,
          secType: originalOrder.contract.secType,
          lastTradeDateOrContractMonth:
            originalOrder.contract.lastTradeDateOrContractMonth,
          tradingClass: "M" + originalOrder.contract.tradingClass,
          localSymbol: "M" + originalOrder.contract.localSymbol,
        },
        order: {
          action: originalOrder.order.action,
          totalQuantity: originalOrder.order.totalQuantity,
          orderType: originalOrder.order.orderType,
          lmtPrice: originalOrder.order.lmtPrice,
        },
      };

      let isExists = await checkIsSymbolExists(orderToOpen);
      console.log("SYMBOL", isExists);
      if (!isExists.length) {
        return null;
      }

      // MODIFY SOME FIELDS
      orderToOpen.contract.exchange = isExists[0].contract.exchange;

      return orderToOpen;
    } else {
      return false;
      // TODO HANDLER ORDER IS NOT OPENABLE
    }
  };

  setInterval(async () => {
    let orders = await clientOrigin.getAllOpenOrders();
    if (orders.length > 0) {
      let ordersToExecute = newOrdersDetected(orders);
      ordersToExecute.forEach((order) => {
        modifyOrderBeforeOpen(order).then(async (modifiedOrder) => {
          if (modifiedOrder) {
            let result = await openOrder(modifiedOrder);
          }
        });
      });
    }
  }, 10);
}

run()
  .then(() => {})
  .catch((e) => {
    console.log("failure");
    console.log(e);
    process.exit();
  });
