import { autoCorrect } from "./autoCorrect.js";
import { formatResults } from "./formatCode.js";
import {
  setOrder,
  getItemId,
  getJWT,
  getItems,
  getMyOrders,
  getItemOrders,
  getItemNameById,
  updateOrder,
} from "./api.js";
import { setTitle } from "./prompt/title.js";

async function main() {
  try {
    const JWT = await getJWT();
    const myOrders = await getMyOrders(JWT);

    for (const order of myOrders) {
      const ingameSellOrders = (await getItemOrders(order.itemId)).filter(
        (order) => order.user.status === "ingame" && order.type === "sell"
      );

      const sortedOrders = ingameSellOrders.sort(
        (a, b) => a.platinum - b.platinum
      );

      const fifthSellOrder =
        sortedOrders.length > 4
          ? sortedOrders[4].platinum
          : sortedOrders[sortedOrders.length - 1].platinum;

      console.log(await getItemNameById(order.itemId), fifthSellOrder);

      // for each order update it with the fifth sell order
      await updateOrder(
        JWT,
        {
          platinum: fifthSellOrder,
        },
        order.id
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error(error);
  }
}

main();
