// Formatage des résultats pour un affichage plus agréable
function formatResults(matches) {
  return matches
    .map((match, index) => {
      const bar = "█".repeat(Math.round(match.percentage / 5));
      return `${index + 1}. ${match.item.padEnd(15)} | ${
        match.percentage
      }% ${bar}`;
    })
    .join("\n");
}

export { formatResults };
