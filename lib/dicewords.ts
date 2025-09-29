let dicewords: string[] | null = null;

/**
 * Load dicewords from the public file
 */
async function loadDicewords(): Promise<string[]> {
  if (dicewords) return dicewords;

  try {
    const response = await fetch("/dicewords.txt");
    if (!response.ok) {
      throw new Error(`Failed to fetch dicewords: ${response.statusText}`);
    }
    const text = await response.text();
    dicewords = text
      .trim()
      .split("\n")
      .map((word) => word.trim())
      .filter((word) => word.length > 0);
    return dicewords;
  } catch (error) {
    console.error("Failed to load dicewords:", error);
    throw new Error("Failed to load dicewords dictionary");
  }
}

/**
 * Generate dicewords from binary data using SHA256 hash for display purposes only
 * This is used to create human-readable representations but not for data recovery
 */
export async function generateDicewordsFromData(
  data: Uint8Array,
  wordCount: number,
): Promise<string[]> {
  const words = await loadDicewords();
  const result: string[] = [];

  // Create a deterministic hash from the data
  const buffer = new ArrayBuffer(data.length);
  const view = new Uint8Array(buffer);
  view.set(data);

  const hashBuffer = await crypto.subtle.digest("SHA-256", view);
  const hashArray = new Uint8Array(hashBuffer);

  // Use pairs of bytes from the hash to select words
  for (let i = 0; i < wordCount; i++) {
    // Use 2 bytes per word to get good distribution across the word list
    const byte1 = hashArray[i * 2] || 0;
    const byte2 = hashArray[i * 2 + 1] || 0;
    const index = ((byte1 << 8) | byte2) % words.length;
    result.push(words[index]);
  }

  return result;
}

/**
 * Validate that all words exist in the dictionary
 */
export async function validateDicewords(words: string[]): Promise<boolean> {
  const wordList = await loadDicewords();
  return words.every((word) => wordList.includes(word));
}

/**
 * Get the total number of words in the dictionary
 */
export async function getDicewordCount(): Promise<number> {
  const words = await loadDicewords();
  return words.length;
}
