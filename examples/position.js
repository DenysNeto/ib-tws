import { Client, Contract, Order } from "../index.js";

console.log("POSIT");

async function run() {
  let api = new Client({
    host: "127.0.0.1",
    port: 7497,
  });

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
