import { z } from "zod";

const SASResultSchema = z.object({
  digits: z.string(),
  words: z.array(z.string()),
});

export type SASResult = z.infer<typeof SASResultSchema>;

let dicewords: string[] | null = null;

/**
 * Load dicewords from the public file for SAS generation
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
    console.error("Failed to load dicewords for SAS:", error);
    throw new Error("Failed to load dicewords dictionary for SAS generation");
  }
}

export async function computeSAS(
  writerFingerprint: string,
  readerFingerprint: string,
): Promise<SASResult> {
  // Sort fingerprints to ensure consistent ordering regardless of role
  const sortedFingerprints = [writerFingerprint, readerFingerprint].sort();
  const input = `${sortedFingerprints[0]}:${sortedFingerprints[1]}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);

  // Extract 6 digits (000000-999999)
  const value = (hashArray[0] << 16) | (hashArray[1] << 8) | hashArray[2];
  const digits = (value % 1000000).toString().padStart(6, "0");

  // Load dicewords and extract 6 words
  const wordList = await loadDicewords();

  const word1Index = ((hashArray[3] << 8) | hashArray[4]) % wordList.length;
  const word2Index = ((hashArray[5] << 8) | hashArray[6]) % wordList.length;
  const word3Index = ((hashArray[7] << 8) | hashArray[8]) % wordList.length;
  const word4Index = ((hashArray[9] << 8) | hashArray[10]) % wordList.length;
  const word5Index = ((hashArray[11] << 8) | hashArray[12]) % wordList.length;
  const word6Index = ((hashArray[13] << 8) | hashArray[14]) % wordList.length;

  const words = [
    wordList[word1Index],
    wordList[word2Index],
    wordList[word3Index],
    wordList[word4Index],
    wordList[word5Index],
    wordList[word6Index],
  ];

  const result = { digits, words };
  return SASResultSchema.parse(result);
}
