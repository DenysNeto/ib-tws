import { polygonClient, restClient, websocketClient } from "polygon.io";
const rest = restClient("VwXLmmpAnfe1ASC32tm3gNnaEYITpwbp");
rest.stocks
  .aggregates("AAPL", 1, "day", "2023-01-01", "2023-04-14")
  .then((data) => {
    console.log(data);
  })
  .catch((e) => {
    console.error("An error happened:", e);
  });
