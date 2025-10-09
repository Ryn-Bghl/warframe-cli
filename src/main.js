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

// ANSI color codes for better console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background colors
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

// Helper functions for colored logging
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.error(`${colors.red}✗ ${msg}${colors.reset}`),
  header: (msg) =>
    console.log(
      `\n${colors.bright}${colors.cyan}${"=".repeat(50)}\n${msg}\n${"=".repeat(
        50
      )}${colors.reset}\n`
    ),
  item: (name, price) =>
    console.log(
      `${colors.magenta}${name}${colors.reset} → ${colors.bgBlack}${colors.bright}${colors.yellow}${price}p${colors.reset}`
    ),
};

// Delay helper with progress indicator
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  return sortedOrders.length > 4
    ? sortedOrders[3].platinum
    : sortedOrders[sortedOrders.length - 1].platinum;
};

/**
 * Get filtered ingame sell orders for an item
 * @param {string} itemId - The item ID
 * @returns {Promise<Array>} Filtered sell orders
 */
const getIngameSellOrders = async (itemId) => {
  const orders = await getItemOrders(itemId);
  return orders.filter(
    (order) => order.user.status === "ingame" && order.type === "sell"
  );
};

/**
 * Update all existing orders with optimal pricing
 * @param {Array} orders - User's current orders
 * @param {string} JWT - Authentication token
 * @returns {Promise<void>}
 */
async function updateMyOrders(orders, JWT) {
  log.header("📝 Updating Existing Orders");

  let successCount = 0;
  let failCount = 0;

  for (const order of orders) {
    try {
      const itemName = await getItemNameById(order.itemId);
      const ingameSellOrders = await getIngameSellOrders(order.itemId);

      if (ingameSellOrders.length === 0) {
        log.warning(`No ingame orders found for ${itemName}`);
        continue;
      }

      const optimalPrice = calculateOptimalPrice(ingameSellOrders);
      log.item(itemName, optimalPrice);

      await updateOrder(JWT, { platinum: optimalPrice }, order.id);

      successCount++;
      log.success(`Updated ${itemName}`);
      await delay(500);
    } catch (error) {
      failCount++;
      log.error(`Failed to update order: ${error.message}`);
    }
  }

  console.log(`\n${colors.bright}Summary:${colors.reset}`);
  log.success(`Successfully updated: ${successCount}`);
  if (failCount > 0) log.error(`Failed: ${failCount}`);
}

/**
 * Import orders from a file and create/update orders
 * @param {string} filePath - Path to the items file
 * @param {string} JWT - Authentication token
 * @param {Array} myOrders - User's existing orders
 * @returns {Promise<void>}
 */
async function importOrders(filePath, JWT, myOrders) {
  log.header("📦 Importing Orders from File");
  log.info(`Reading file: ${filePath}`);

  const data = await getCrackedItems(filePath);
  const totalItems = Object.keys(data).length;
  let current = 0;
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const [itemName, quantity] of Object.entries(data)) {
    current++;
    console.log(`\n${colors.dim}[${current}/${totalItems}]${colors.reset}`);
    log.info(`Processing: ${itemName} x${quantity}`);

    try {
      const itemId = await getItemId(itemName);
      const ingameSellOrders = await getIngameSellOrders(itemId);

      if (ingameSellOrders.length === 0) {
        log.warning(`No ingame orders found for ${itemName}, skipping...`);
        failed++;
        continue;
      }

      log.info(`Found ${ingameSellOrders.length} ingame sell orders`);

      const optimalPrice = calculateOptimalPrice(ingameSellOrders);
      log.item(itemName, optimalPrice);

      const existingOrder = myOrders.find((order) => order.itemId === itemId);

      if (existingOrder) {
        await updateOrder(
          JWT,
          {
            platinum: optimalPrice,
            quantity: existingOrder.quantity + quantity,
          },
          existingOrder.id
        );
        updated++;
        log.success(`Updated order: ${itemName} x${quantity}`);
      } else {
        await setOrder(JWT, {
          itemId,
          platinum: optimalPrice,
          quantity,
          visible: true,
          type: "sell",
        });
        created++;
        log.success(`Created new order: ${itemName} x${quantity}`);
      }

      await delay(500);
    } catch (error) {
      failed++;
      log.error(`Failed to process ${itemName}: ${error.message}`);
    }
  }

  console.log(`\n${colors.bright}Import Summary:${colors.reset}`);
  log.success(`Created: ${created}`);
  log.success(`Updated: ${updated}`);
  if (failed > 0) log.error(`Failed: ${failed}`);
}

/**
 * Display help information
 */
function displayHelp() {
  console.log(`
${colors.bright}${colors.cyan}Order Management System - CLI Tool${colors.reset}

${colors.bright}Usage:${colors.reset}
  node main.js [options]

${colors.bright}Options:${colors.reset}
  ${colors.green}--update${colors.reset}              Update all existing orders with optimal pricing
  ${colors.green}--import${colors.reset} <file>       Import orders from a file (default: ./items.txt)
  ${colors.green}--help${colors.reset}, ${colors.green}-h${colors.reset}          Display this help message

${colors.bright}Examples:${colors.reset}
  ${colors.dim}# Update existing orders${colors.reset}
  node main.js --update

  ${colors.dim}# Import orders from default file${colors.reset}
  node main.js --import

  ${colors.dim}# Import orders from specific file${colors.reset}
  node main.js --import ./my-items.txt

  ${colors.dim}# Update existing orders and import new ones${colors.reset}
  node main.js --update --import

  ${colors.dim}# Update and import from specific file${colors.reset}
  node main.js --update --import ./custom-items.txt
`);
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
        // Check if next argument is a file path
        if (args[i + 1] && !args[i + 1].startsWith("--")) {
          options.importFile = args[i + 1];
          i++; // Skip next argument since we consumed it
        }
        break;
      default:
        log.warning(`Unknown argument: ${arg}`);
        break;
    }
  }

  return options;
}

/**
 * Main execution function
 */
async function main() {
  const options = parseArgs();

  // Display help if requested or no options provided
  if (options.help || (!options.update && !options.import)) {
    displayHelp();
    return;
  }

  try {
    log.header("🚀 Order Management System");

    log.info("Authenticating...");
    const JWT = await getJWT();
    log.success("Authentication successful");

    log.info("Fetching your current orders...");
    const myOrders = await getMyOrders(JWT);
    log.success(`Found ${myOrders.length} existing orders`);

    // Execute based on CLI arguments
    if (options.update) {
      await updateMyOrders(myOrders, JWT);
    }

    if (options.import) {
      // Refresh orders if we just updated them
      const currentOrders = options.update ? await getMyOrders(JWT) : myOrders;
      await importOrders(options.importFile, JWT, currentOrders);
    }

    log.header("✨ All operations completed successfully!");
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
