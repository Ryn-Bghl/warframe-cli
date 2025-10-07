import { autoCorrect } from "./autoCorrect.js";
import { formatResults } from "./formatCode.js";
import { setOrder, getItemId, getJWT, getItems } from "./api.js";
import { setTitle } from "./prompt/title.js";

async function main() {
  setTitle();
  const JWT = await getJWT();

  // Utilisation avec une liste statique
  const items = await getItems();

  const input = "nekro prime set";
  const results = autoCorrect(input, items, 5);
  // console.log("Résultats formatés:\n", formatResults(results));
  // console.log(
  //   // TOFIX: NOT PRACTICAL
  //   await setOrder(JWT, {
  //     type: "sell",
  //     itemId: await getItemId("nekros_prime_set"),
  //     quantity: 1,
  //     platinum: 50,
  //     visible: false,
  //   })
  // );
}

main();
