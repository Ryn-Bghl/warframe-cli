import {
  setOrder,
  getItemId,
  getJWT,
  getMyOrders,
  getItemOrders,
  getItemNameById,
  updateOrder,
} from "./api.js";
import { getCrackedItems } from "./import.js";
import * as clack from "@clack/prompts";
import { setTimeout as delay } from "node:timers/promises";
import color from "picocolors";

const banner = `
██╗    ██╗ █████╗ ██████╗ ███████╗██████╗  █████╗ ███╗   ███╗███████╗     ██████╗██╗     ██╗
██║    ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗████╗ ████║██╔════╝    ██╔════╝██║     ██║
██║ █╗ ██║███████║██████╔╝█████╗  ██████╔╝███████║██╔████╔██║█████╗█████╗██║     ██║     ██║
██║███╗██║██╔══██║██╔══██╗██╔══╝  ██╔══██╗██╔══██║██║╚██╔╝██║██╔══╝╚════╝██║     ██║     ██║
╚███╔███╔╝██║  ██║██║  ██║██║     ██║  ██║██║  ██║██║ ╚═╝ ██║███████╗    ╚██████╗███████╗██║
 ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝     ╚═════╝╚══════╝╚═╝`;

/**
 * Calculate the optimal price based on ingame sell orders
 * @param {Array} orders - Array of sell orders
 * @returns {number} The optimal platinum price
 */
const calculateOptimalPrice = (orders) => {
  if (orders.length === 0) {
    throw new Error("No orders available to calculate price");
  }

  const sortedOrders = orders.sort((a, b) => a.platinum - b.platinum);

  if (sortedOrders.length < 5) {
    const middleIndex = Math.floor(sortedOrders.length / 2);
    return sortedOrders[middleIndex].platinum;
  }

  return sortedOrders[3].platinum;
};

/**
 * Get filtered ingame sell orders for an item
 * @param {string} itemId - The item ID
 * @returns {Promise<Array>} Filtered sell orders
 */
const getIngameSellOrders = async (itemId) => {
  const orders = await getItemOrders(itemId);
  return orders.filter(
    (order) => order.user.status === "ingame" && order.type === "sell",
  );
};

/**
 * Update all existing orders with optimal pricing
 * @param {Array} orders - User's current orders
 * @param {string} JWT - Authentication token
 * @returns {Promise<Object>} Stats object with success and fail counts
 */
async function updateMyOrders(orders, JWT) {
  const s = clack.spinner();
  s.start("Updating existing orders");

  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (const order of orders) {
    try {
      const itemName = await getItemNameById(order.itemId);
      s.message(`Processing ${color.magenta(itemName)}`);

      const ingameSellOrders = await getIngameSellOrders(order.itemId);

      if (ingameSellOrders.length === 0) {
        clack.log.warning(`No ingame orders found for ${itemName}`);
        continue;
      }

      const optimalPrice = calculateOptimalPrice(ingameSellOrders);

      await updateOrder(JWT, { platinum: optimalPrice }, order.id);

      successCount++;
      results.push({
        name: itemName,
        price: optimalPrice,
        status: "success",
      });

      await delay(500);
    } catch (error) {
      failCount++;
      clack.log.error(`Failed to update order: ${error.message}`);
    }
  }

  s.stop("Orders updated");

  // Display results
  for (const result of results) {
    clack.log.success(
      `${color.magenta(result.name)} → ${color.bgBlack(
        color.yellow(` ${result.price}p `),
      )}`,
    );
  }

  clack.note(
    `${color.green(`✓ Successfully updated: ${successCount}`)}\n${
      failCount > 0 ? color.red(`✗ Failed: ${failCount}`) : ""
    }`,
    "Update Summary",
  );

  return { successCount, failCount };
}

/**
 * Import orders from a file and create/update orders
 * @param {string} filePath - Path to the items file
 * @param {string} JWT - Authentication token
 * @param {Array} myOrders - User's existing orders
 * @returns {Promise<Object>} Stats object with created, updated, and failed counts
 */
async function importOrders(filePath, JWT, myOrders) {
  const s = clack.spinner();
  s.start(`Reading file: ${filePath}`);

  const data = await getCrackedItems(filePath);
  const totalItems = Object.keys(data).length;

  s.stop(`Found ${totalItems} items to import`);

  let current = 0;
  let created = 0;
  let updated = 0;
  let failed = 0;
  const results = [];

  const importSpinner = clack.spinner();
  importSpinner.start("Importing orders");

  for (const [itemName, quantity] of Object.entries(data)) {
    current++;
    importSpinner.message(
      `[${current}/${totalItems}] Processing ${color.cyan(
        itemName,
      )} x${quantity}`,
    );

    try {
      const itemId = await getItemId(itemName);
      const ingameSellOrders = await getIngameSellOrders(itemId);

      if (ingameSellOrders.length === 0) {
        clack.log.warning(
          `No ingame orders found for ${itemName}, skipping...`,
        );
        failed++;
        continue;
      }

      const optimalPrice = calculateOptimalPrice(ingameSellOrders);
      const existingOrder = myOrders.find((order) => order.itemId === itemId);

      if (existingOrder) {
        await updateOrder(
          JWT,
          {
            platinum: optimalPrice,
            quantity: existingOrder.quantity + quantity,
          },
          existingOrder.id,
        );
        updated++;
        results.push({
          name: itemName,
          quantity,
          price: optimalPrice,
          action: "updated",
        });
      } else {
        await setOrder(JWT, {
          itemId,
          platinum: optimalPrice,
          quantity,
          visible: true,
          type: "sell",
        });
        created++;
        results.push({
          name: itemName,
          quantity,
          price: optimalPrice,
          action: "created",
        });
      }

      await delay(500);
    } catch (error) {
      failed++;
      clack.log.error(`Failed to process ${itemName}: ${error.message}`);
    }
  }

  importSpinner.stop("Import completed");

  // Display results
  for (const result of results) {
    const action =
      result.action === "created"
        ? color.green("CREATED")
        : color.blue("UPDATED");
    clack.log.info(
      `${action} ${color.magenta(result.name)} x${
        result.quantity
      } → ${color.bgBlack(color.yellow(` ${result.price}p `))}`,
    );
  }

  clack.note(
    `${color.green(`✓ Created: ${created}`)}\n${color.blue(
      `✓ Updated: ${updated}`,
    )}${failed > 0 ? "\n" + color.red(`✗ Failed: ${failed}`) : ""}`,
    "Import Summary",
  );

  return { created, updated, failed };
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    update: false,
    import: false,
    importFile: "./items.txt",
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--update":
        options.update = true;
        break;
      case "--import":
        options.import = true;
        if (args[i + 1] && !args[i + 1].startsWith("--")) {
          options.importFile = args[i + 1];
          i++;
        }
        break;
      default:
        break;
    }
  }

  return options;
}

/**
 * Interactive mode using Clack prompts
 */
async function interactiveMode(JWT, myOrders) {
  const action = await clack.select({
    message: "What would you like to do?",
    options: [
      {
        value: "update",
        label: "Update existing orders",
        hint: "Refresh prices for all orders",
      },
      {
        value: "import",
        label: "Import orders from file",
        hint: "Add new orders from a file",
      },
      { value: "both", label: "Update and Import", hint: "Do both operations" },
      { value: "exit", label: "Exit", hint: "Quit the program" },
    ],
  });

  if (clack.isCancel(action) || action === "exit") {
    clack.cancel("Operation cancelled");
    process.exit(0);
  }

  if (action === "update" || action === "both") {
    await updateMyOrders(myOrders, JWT);
  }

  if (action === "import" || action === "both") {
    const filePath = await clack.text({
      message: "Enter the path to your items file:",
      placeholder: "./items.txt",
      defaultValue: "./items.txt",
    });

    if (clack.isCancel(filePath)) {
      clack.cancel("Operation cancelled");
      process.exit(0);
    }

    const currentOrders = action === "both" ? await getMyOrders(JWT) : myOrders;
    await importOrders(filePath, JWT, currentOrders);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.clear();

  clack.intro(color.cyan(banner));

  const options = parseArgs();

  // Help mode
  if (options.help) {
    clack.note(
      `${color.bold("Usage:")}\n  node main.js [options]\n\n${color.bold(
        "Options:",
      )}\n  --update              Update all existing orders\n  --import <file>       Import orders from file\n  --help, -h           Display this help\n\n${color.bold(
        "Examples:",
      )}\n  node main.js --update\n  node main.js --import\n  node main.js --update --import`,
      "CLI Help",
    );
    return;
  }

  try {
    const authSpinner = clack.spinner();
    authSpinner.start("Authenticating...");
    const JWT = await getJWT();
    authSpinner.stop("Authentication successful");

    const ordersSpinner = clack.spinner();
    ordersSpinner.start("Fetching your orders...");
    const myOrders = await getMyOrders(JWT);
    ordersSpinner.stop(`Found ${color.cyan(myOrders.length)} existing orders`);

    // Interactive mode if no arguments
    if (!options.update && !options.import) {
      await interactiveMode(JWT, myOrders);
    } else {
      // CLI mode
      if (options.update) {
        await updateMyOrders(myOrders, JWT);
      }

      if (options.import) {
        const currentOrders = options.update
          ? await getMyOrders(JWT)
          : myOrders;
        await importOrders(options.importFile, JWT, currentOrders);
      }
    }

    clack.outro(color.green("All operations completed successfully! ✨"));
  } catch (error) {
    clack.log.error(`Fatal error: ${error.message}`);
    console.error(error);
    clack.outro(color.red("Operation failed"));
    process.exit(1);
  }
}

main();
