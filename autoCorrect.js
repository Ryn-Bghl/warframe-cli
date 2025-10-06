/**
 * Calculates the Levenshtein distance between two strings.
 * @param {string} str1 - The first string.
 * @param {string} str2 - The second string.
 * @returns {number} The Levenshtein distance between the two strings.
 */
function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const matrix = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // suppression
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * Calculates the similarity score (0-100%) between two strings.
 * @param {string} str1 - The first string.
 * @param {string} str2 - The second string.
 * @returns {number} The similarity score (0-100%) between the two strings.
 */
function calculateSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return ((1 - distance / maxLength) * 100).toFixed(2);
}

/**
 * Finds the closest string matches from a list.
 * @param {string} input - The input string.
 * @param {string[]} itemList - The list of strings to search.
 * @param {number} topN - The number of top matches to return (default: 5).
 * @returns {Object[]} An array of objects containing the closest matches with their scores.
 */
function autoCorrect(input, itemList, topN = 5) {
  if (!input || !input.trim()) {
    return [];
  }

  // Calcul des matches avec scores
  const matches = itemList
    .map((item) => ({
      item: item,
      percentage: parseFloat(calculateSimilarity(input, item)),
      distance: levenshteinDistance(input, item),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, topN);

  return matches;
}

export { autoCorrect };
