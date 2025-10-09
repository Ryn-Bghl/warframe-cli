# Tips and Tricks for Warframe CLI

This document contains a collection of tips, tricks, and suggestions to help improve and expand your Warframe CLI project.

## 1. Project Structure & Maintainability

### 1.1. Modularize Your Code

Your `main.js` file is growing. To keep the project manageable, consider splitting it into more focused modules:

- **`cli.js`**: Handles command-line argument parsing (using a library like `yargs` or `commander`) and the logic for non-interactive mode.
- **`interactive.js`**: Contains the `interactiveMode` function and all related `@clack/prompts` UI logic.
- **`core.js`**: Holds the core business logic, like `updateMyOrders` and `importOrders`, which can be called by both the CLI and interactive modes.
- **`config.js`**: Reads and exports configuration from environment variables (`.env`). This provides a single, clear place to manage defaults and settings.

### 1.2. Add Code Linting and Formatting

To ensure consistent code style and catch common errors early, integrate **ESLint** (for linting) and **Prettier** (for formatting).

1. **Install dev dependencies**:

   ```bash
   npm install --save-dev eslint prettier eslint-config-prettier
   ```

2. **Add scripts to `package.json`**:

   ```json
   "scripts": {
     "lint": "eslint .",
     "format": "prettier --write ."
   }
   ```

### 1.3. Use JSDoc for Documentation

Add JSDoc comments to your functions. This clarifies what each function does, its parameters, and what it returns. It also enables auto-generating documentation later.

```javascript
/**
 * Calculates the optimal selling price based on a list of orders.
 * @param {Array<object>} orders - A list of order objects from the API.
 * @returns {number} The calculated optimal platinum price.
 * @throws {Error} If no orders are available.
 */
const calculateOptimalPrice = (orders) => {
  // ...
};
```

## 2. Command-Line Interface (CLI) Enhancements

### 2.1. Use a CLI Argument Parser

Manually parsing `process.argv` is fine for a few flags, but it becomes difficult to manage as you add more complex commands and options. Libraries like **`yargs`** or **`commander`** are excellent for this.

- **Benefits**: They automatically generate help text (`--help`), handle sub-commands (e.g., `wfm order create`), validate inputs, and make your CLI much more powerful.
- **Example with `yargs`**:

  ```javascript
  // main.js
  import yargs from "yargs";
  import { hideBin } from "yargs/helpers";

  yargs(hideBin(process.argv))
    .command(
      "update",
      "Update existing orders",
      () => {},
      async (argv) => {
        // Your update logic here
      },
    )
    .command(
      "import [file]",
      "Import orders from a file",
      (yargs) => {
        return yargs.positional("file", {
          describe: "Path to the items file",
          default: "./items.txt",
        });
      },
      async (argv) => {
        // Your import logic here, using argv.file
      },
    )
    .demandCommand(1, "You need at least one command before moving on")
    .help().argv;
  ```

### 2.2. Make Your CLI Executable

You can make your script runnable directly (e.g., `./wfm-cli` or `wfm-cli` globally) instead of `node ./src/main.js`.

1. Add a "bin" field to `package.json`:

   ```json
   "bin": {
     "wfm-cli": "./src/main.js"
   }
   ```

2. Add a "shebang" to the very top of `src/main.js`:

   ```javascript
   #!/usr/bin/env node
   ```

3. Run `npm link` to make the command available globally on your system for testing.

## 3. API Interaction

### 3.1. Create an API Client Class

Instead of passing the `JWT` to every API function, encapsulate your API logic in a class. This makes your code cleaner and easier to manage.

```javascript
// api.js
export class WarframeMarketAPI {
  constructor(jwt) {
    this.jwt = jwt;
    this.baseUrl = "https://api.warframe.market/v1";
  }

  async #request(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `JWT ${this.jwt}`,
      ...options.headers,
    };
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  updateOrder(orderId, payload) {
    return this.#request(`/orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  getMyOrders() {
    return this.#request("/profile/orders");
  }
}
```

### 3.2. Implement Caching for Static Data

The list of all items from the `/items` endpoint doesn't change often. You can **cache** this data to a local file. On startup, check if the cache file exists and is recent (e.g., less than 24 hours old). If so, use the cache; otherwise, fetch from the API and update the cache. This will make your tool start and feel much faster.

### 3.3. Advanced Rate Limiting

Your `delay(500)` is a good start. For more complex scenarios, consider a promise-based queueing library like **`p-limit`**. This allows you to run multiple requests in parallel (e.g., 3 at a time) without overwhelming the API, which is much faster than waiting for each one to finish sequentially.

## 4. Testing & Quality Assurance

### 4.1. Adopt a Testing Framework

Use a dedicated framework like **Jest** to write more robust tests.

- **Mocking**: Jest allows you to "mock" modules. You can test your `updateMyOrders` function by providing fake API responses without ever hitting the real network. This makes tests fast, reliable, and predictable.
- **Assertions**: Jest has a rich set of "matchers" to verify your code's output (e.g., `expect(result).toEqual(...)`, `expect(myFunction).toThrow()`).

### 4.2. Add a Debugging Utility

Instead of `console.log`, use a library like **`debug`**. It allows you to enable logging via an environment variable (`DEBUG=wfm-cli:* npm run start`) without cluttering the console output for normal users.

## 5. Security

### 5.1. Do Not Store Passwords

In your `IDEAS.md`, you mention adding a feature to set password and email. **Avoid this.** Never store user passwords in plain text. The current approach of using `.env` is for your own credentials.

### 5.2. Securely Store the JWT

If this tool were to be distributed, the JWT should be stored securely, not in a plain text file. Use platform-specific keychain/credential managers. The **`keytar`** library in Node.js is excellent for this, as it uses the native credential stores on Windows, macOS, and Linux.

## 6. User Experience (UX)

### 6.1. Make Pricing Strategy Configurable

Your `calculateOptimalPrice` function currently uses the 4th order price. This is a specific strategy. You could allow the user to configure this. For example, add a `--pricing-strategy` flag or a config setting to choose between "aggressive" (2nd price), "moderate" (4th price), or "average" (mean of top 5).

### 6.2. Persistent Configuration

For settings like the default import file path, you could save the user's last-used value in a local config file (e.g., `.wfm-cli-config.json`). This provides a better experience than having to type it every time.
