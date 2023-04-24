import { Client, Contract, Order } from "../index.js";

// 7499 - origin
//  7498 - consumer

// [
//   {
//     host: "127.0.0.1",
//     port: 7499,
//   },
//   {
//     host: "127.0.0.1",
//     port: 7499,
//   },
//   {
//     host: "127.0.0.1",
//     port: 7499,
//   },
// ];

async function run() {
  let clientOrigin = new Client({
    host: "127.0.0.1",
    port: 7499,
  });
  // TODO ARRAY CONSUMERS
  let clientConsumer = new Client({
    host: "127.0.0.1",
    port: 7498,
  });

  await new Promise(function (accept, _) {
    setTimeout(function () {
      accept();
    }, 2000);
  });

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
      let index = OrdersManager.ordersOrigin.findIndex((elInner) => {
        return elInner.order.permId == el.order.permId;
      });
      if (index != -1) {
        ordersToExecute.push(el);
      }
    });
    OrdersManager.ordersOrigin = newOrders;
    return ordersToExecute;
  };

  // TODO WHAT DATA IS NEEDED
  let openOrder = async (orderData) => {
    console.log("OPENED_PRICE", orderData);
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
        exchange: "CME",
        currency: "USD",
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
    console.log("FFF", type);
    let currContract = null;
    if (contract.contract.secType == "FUT") {
      // currContract = Contract.future({
      //   symbol: type,
      //   lastTradeDateOrContractMonth:
      //     contract.contract.lastTradeDateOrContractMonth,
      // });
      currContract = {
        symbol: type,
        secType: "FUT",
        lastTradeDateOrContractMonth:
          contract.contract.lastTradeDateOrContractMonth,
      };
    } else if (contract.contract.secType == "STK") {
      currContract = Contract.stock(type);
    }
    console.log("CONTR", currContract);
    return clientConsumer.getContractDetails(currContract);
    // let details = await clientConsumer.getContractDetails(currContract);
    // console.log("DETAILS", details.length);
    // return details;
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
      console.log("bla");
      let isExists = await checkIsSymbolExists(orderToOpen);
      console.log("IS_EXISTS", isExists);

      if (!isExists.length) {
        return null;
      }

      return orderToOpen;
    } else {
      return false;
      // TODO HANDLER ORDER IS NOT OPENABLE
    }
    // if(originalOrder.contract.symbol == "")
  };

  // console.log("ordersOrigin", ordersOrigin);
  // console.log("ordersConsumer", ordersConsumer);

  setInterval(async () => {
    let orders = await clientOrigin.getAllOpenOrders();

    if (orders.length > 0) {
      let ordersToExecute = newOrdersDetected(orders);
      ordersToExecute.forEach((order) => {
        modifyOrderBeforeOpen(order).then(async (modifiedOrder) => {
          //  console.log("AAA", modifiedOrder);
          if (modifiedOrder) {
            let result = await openOrder(modifiedOrder);
            console.log("RESULT__OOOOOO", result);
          }
        });
      });
    }
  }, 10);

  return;

  console.log("CURRENT_OPENED_ORDRS_ORIGIN", ordersOrigin);
  console.log("CURRENT_OPENED_ORDRS_CONSUMER", ordersConsumer);

  // DETECT NEW ORDER
  setInterval(async () => {
    console.log("JJJ");
    let orders = await clientOrigin.getAllOpenOrders();
    if (orders.length > 0) {
      newOrderDetected(orders);
    }
    console.log("Opened orders consumer");
    console.log(orders);
  }, 1000);

  return;

  // OPEN ORDER
  if (exampleOrderData.contract.secType == "FUT") {
    let resultOrder = await clientOrigin.placeOrder({
      contract: Contract.future(exampleOrderData.contract),
      order: Order.market({
        action: "BUY",
        totalQuantity: 5,
        transmit: true,
      }),
    });

    console.log("RESULT__", resultOrder);
  }

  //   setInterval(async () => {
  //     let orders = await clientOrigin.getAllOpenOrders();
  //     console.log("Opened orders origin");
  //     console.log(orders);
  //   }, 100);

  // EXAMPLE OPEN ORDER

  //   static market(data) {
  //     assert(data.action);
  //     assert(data.totalQuantity > 0);

  //     return Contract._toOrder(data, 'MKT', {
  //       transmit: true,
  //       goodAfterTime: '',
  //       goodTillDate: ''
  //     });
  //   }

  // OPEN ORDERS

  if (exampleOrderData.contract.secType == "FUT") {
    let resultOrder = await clientOrigin.placeOrder({
      contract: Contract.future(exampleOrderData.contract),
      order: Order.market({
        action: "BUY",
        totalQuantity: 5,
        transmit: true,
      }),
    });

    console.log("RESULT__", resultOrder);
  }

  // TODO TEST
  //   else if (exampleOrderData.contract.secType == "STC") {
  //     let order2 = await clientOrigin.placeOrder({
  //       contract: Contract.stock(exampleOrderData.contract),
  //       order: Order.market(exampleOrderData.order),
  //     });
  //   }

  //   let orders = await clientOrigin.getAllOpenOrders();
  //   console.log("Opened orders");
  //   console.log(orders);

  // CLIENT CONSUMER

  await new Promise(function (accept, _) {
    setTimeout(function () {
      accept();
    }, 5000);
  });

  // let orders = await clientOrigin.getAllOpenOrders();

  console.log("ORDERS :: ", orders);

  setInterval(async () => {
    console.log("JJJ");
    let orders = await clientOrigin.getAllOpenOrders();
    console.log("Opened orders consumer");
    console.log(orders);
  }, 1000);
}

run()
  .then(() => {})
  .catch((e) => {
    console.log("failure");
    console.log(e);
    process.exit();
  });
