import { Client, Contract, Order } from "../index.js";

console.log("POSIT");

async function run() {
  console.log("AAAA");
  let api = new Client({
    host: "127.0.0.1",
    // port: 7497,

    port: 7500,
  });

  console.log("BBB");
  // let clientOrigin = new Client({
  //   //host: "127.0.0.1",
  //   host: "185.175.35.230",
  //   port: 7498,
  // });
  await api.connect();
  let positions = await api.getPositions();
  let ordersTest = await api.getAllOpenOrders();
  console.log("Positions");
  console.log(positions);
  console.log("Orders", ordersTest);
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
