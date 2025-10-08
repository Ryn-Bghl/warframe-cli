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
import { getCrackedItems } from "./import.js";

async function main() {
  try {
    const JWT = await getJWT();
    const myOrders = await getMyOrders(JWT);

    const updateMyOrders = async (orders) => {
      for (const order of orders) {
        const ingameSellOrders = (await getItemOrders(order.itemId)).filter(
          (order) => order.user.status === "ingame" && order.type === "sell"
        );

        const sortedOrders = ingameSellOrders.sort(
          (a, b) => a.platinum - b.platinum
        );

        const fifthSellOrder =
          sortedOrders.length > 4
            ? sortedOrders[3].platinum
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
    };

    // await updateMyOrders(myOrders);

    /**
     * Import orders from a file, and update or create orders based on the file's content.
     * The file is expected to be a text file with each line containing the item name and quantity separated by a space.
     * The function will update the quantity of the order if it already exists, and create a new order if it doesn't.
     *
     * @param {string} filePath - The path to the file containing the orders to import
     * @returns {Promise<void>} A promise that resolves when all orders have been imported
     */
    const importOrders = async (filePath) => {
      const data = await getCrackedItems(filePath);

      console.log(`Importing orders from ${filePath}`);

      for (const [key, value] of Object.entries(data)) {
        console.log(`Importing order for ${key} with quantity ${value}`);

        const ingameSellOrders = (
          await getItemOrders(await getItemId(key))
        ).filter(
          (order) => order.user.status === "ingame" && order.type === "sell"
        );

        console.log(
          `Found ${ingameSellOrders.length} ingame sell orders for ${key}`
        );

        const sortedOrders = ingameSellOrders.sort(
          (a, b) => a.platinum - b.platinum
        );

        const fifthSellOrder =
          sortedOrders.length > 4
            ? sortedOrders[3].platinum
            : sortedOrders[sortedOrders.length - 1].platinum;

        console.log(`Using platinum price ${fifthSellOrder} for ${key}`);

        const itemId = await getItemId(key);

        const isOrderExists = Boolean(
          myOrders.find((order) => order.itemId === itemId)
        );

        console.log(
          `Order ${isOrderExists ? "exists" : "does not exist"} for ${key}`
        );

        if (isOrderExists) {
          await updateOrder(
            JWT,
            {
              platinum: fifthSellOrder,
              quantity:
                myOrders.find((order) => order.itemId === itemId).quantity +
                value,
            },
            myOrders.find((order) => order.itemId === itemId).id
          );
          console.log(`Updated order for ${key} x${value}\n`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else if (!isOrderExists) {
          await setOrder(JWT, {
            itemId,
            platinum: fifthSellOrder,
            quantity: value,
            visible: true,
            type: "sell",
          });
          console.log(`Created new order for ${key} x${value}\n`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    };

    await importOrders("./items.txt");
  } catch (error) {
    console.error(error);
  }
}

main();
