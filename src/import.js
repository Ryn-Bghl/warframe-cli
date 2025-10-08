import { autoCorrect } from "./autoCorrect.js";
import { getItems } from "./api.js";
import * as fs from "fs/promises";

/**
 * Reads the contents of a file and returns a promise containing the file data.
 * @param {string} filePath - The path to the file to read.
 * @returns {Promise<string>} A promise containing the file data.
 */
export async function getCrackedItems(filePath) {
  try {
    const items = await getItems();
    const fileData = (await fs.readFile(filePath, "utf8"))
      .trim()
      .split("\n")
      .filter((line) => line !== "");
    const crackedItems = fileData
      .map((line) => autoCorrect(line, items, 1))
      .flatMap((item) => item.map((i) => i.item));

    const multiset = {};

    for (const val of crackedItems) {
      multiset[val] = (multiset[val] || 0) + 1;
    }

    return multiset;
  } catch (error) {
    throw error;
  }
}
