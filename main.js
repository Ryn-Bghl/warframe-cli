import { autoCorrect } from "./autoCorrect.js";
import { formatResults } from "./formatCode.js";
import { createOrder, getItemId, getJWT } from "./api.js";

async function main() {
  const JWT = await getJWT();

  // Utilisation avec une liste statique
  const technologies = [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "HTML",
    "CSS",
  ];

  console.log("JWT obtenu:", JWT);
  const input = "pthn";
  const results = autoCorrect(input, technologies, 5, true);
  console.log("Résultats formatés:\n", formatResults(results));
  console.log(
    await createOrder(JWT, {
      type: "sell",
      itemId: await getItemId("nekros_prime_set"),
      quantity: 1,
      platinum: 50,
      visible: true,
    })
  );
}

main();
