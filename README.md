# WFM Automanager

A Node.js-based command-line tool designed to automate interactions with the [Warframe Market](https://warframe.market) API. This tool allows you to programmatically manage your item listings, including creating orders and looking up items.

## Features

- **Authentication**: Securely authenticates with the Warframe Market API using your credentials to obtain a session token (JWT).
- **Order Management**: Create new buy or sell orders directly from the command line.
- **Item ID Lookup**: Fetches the internal Warframe Market ID for a given item name.
- **Smart Autocorrection**: Includes a utility using Levenshtein distance to find the most likely item names from a list, helping to correct typos or partial names.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- An active [Warframe Market](https://warframe.market) account

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Ryn-Bghl/wfm-automanager.git
    cd wfm-automanager
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Configuration

This project uses environment variables to handle your sensitive login credentials securely.

1.  Create a new file named `.env` in the root of the project directory.

2.  Add the following lines to the `.env` file, replacing the placeholder values with your actual Warframe Market credentials:

    ```env
    EMAIL=your_email@example.com
    PASSWORD=your_secret_password
    ```

    **Important**: The `.gitignore` file is already configured to ignore `.env` files, preventing you from accidentally committing your credentials to a public repository. Do not change this.

## Usage

The main logic is located in `main.js`. You can modify this file to implement the automation tasks you need.

To run the script, execute the following command in your terminal:

```bash
npm run dev
```

This will start the `main.js` script, which will:
1.  Authenticate with your credentials.
2.  Obtain a JWT for the session.
3.  Execute the logic you have defined in the file (e.g., create a new order).

## Code Overview

-   **`main.js`**: The main entry point for the application. This is the file you will modify to build your automation logic.
-   **`api.js`**: Handles all communication with the Warframe Market API, including authentication (`getJWT`), order creation (`createOrder`), and item lookups (`getItemId`).
-   **`autoCorrect.js`**: Provides a utility function (`autoCorrect`) to find the closest string matches from a list, which is useful for correcting item names.
-   **`formatCode.js`**: (Assumed purpose) A helper to format the output for better readability in the console.

## License

This project is licensed under the ISC License. See the `LICENSE` file for details.
