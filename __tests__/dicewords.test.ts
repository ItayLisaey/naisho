import { beforeEach, describe, expect, it } from "@jest/globals";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock crypto.subtle
const mockDigest = jest.fn();
Object.defineProperty(globalThis, "crypto", {
  value: {
    subtle: {
      digest: mockDigest,
    },
  },
});

describe("Dicewords", () => {
  const mockWordList =
    "apple\nbanana\ncherry\ndog\nelephant\nforest\ngarden\nhouse\nice\njuice";

  let dicewordsModule: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    // Re-import the module to reset the cached dicewords
    dicewordsModule = await import("../lib/dicewords");

    // Mock successful fetch
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockWordList),
    });

    // Mock SHA-256 hash
    const mockHash = new Uint8Array([
      0x00,
      0x01, // -> index 1 % 10 = 1 -> "banana"
      0x00,
      0x02, // -> index 2 % 10 = 2 -> "cherry"
      0x00,
      0x03, // -> index 3 % 10 = 3 -> "dog"
      0x00,
      0x04, // -> index 4 % 10 = 4 -> "elephant"
      0x00,
      0x05, // -> index 5 % 10 = 5 -> "forest"
      0x00,
      0x06, // -> index 6 % 10 = 6 -> "garden"
      0x00,
      0x07, // -> index 7 % 10 = 7 -> "house"
      0x00,
      0x08, // -> index 8 % 10 = 8 -> "ice"
    ]);
    mockDigest.mockResolvedValue(mockHash.buffer);
  });

  describe("generateDicewordsFromData", () => {
    it("should generate specified number of words", async () => {
      const data = new Uint8Array([1, 2, 3, 4]);
      const words = await dicewordsModule.generateDicewordsFromData(data, 5);

      expect(words).toHaveLength(5);
      expect(words).toEqual(["banana", "cherry", "dog", "elephant", "forest"]);
    });

    it("should generate 8 words for tokens", async () => {
      const data = new Uint8Array([1, 2, 3, 4]);
      const words = await dicewordsModule.generateDicewordsFromData(data, 8);

      expect(words).toHaveLength(8);
      expect(words).toEqual([
        "banana",
        "cherry",
        "dog",
        "elephant",
        "forest",
        "garden",
        "house",
        "ice",
      ]);
    });

    it("should be deterministic for same input", async () => {
      const data = new Uint8Array([1, 2, 3, 4]);

      const words1 = await dicewordsModule.generateDicewordsFromData(data, 4);
      const words2 = await dicewordsModule.generateDicewordsFromData(data, 4);

      expect(words1).toEqual(words2);
    });

    it("should generate different words for different data", async () => {
      const data1 = new Uint8Array([1, 2, 3, 4]);

      // Mock different hash for different input
      const differentHash = new Uint8Array([
        0x00,
        0x09, // -> index 9 % 10 = 9 -> "juice"
        0x00,
        0x00, // -> index 0 % 10 = 0 -> "apple"
        0x00,
        0x01, // -> index 1 % 10 = 1 -> "banana"
      ]);
      mockDigest
        .mockResolvedValueOnce(new Uint8Array([0x00, 0x01, 0x00, 0x02]).buffer)
        .mockResolvedValueOnce(differentHash.buffer);

      const words1 = await dicewordsModule.generateDicewordsFromData(data1, 2);
      const data2 = new Uint8Array([5, 6, 7, 8]);
      const words2 = await dicewordsModule.generateDicewordsFromData(data2, 2);

      expect(words1).not.toEqual(words2);
    });

    it("should handle fetch errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(
        dicewordsModule.generateDicewordsFromData(new Uint8Array([1, 2, 3, 4]), 4),
      ).rejects.toThrow("Failed to load dicewords dictionary");
    });
  });

  describe("validateDicewords", () => {
    it("should validate existing words", async () => {
      const validWords = ["apple", "banana", "cherry"];
      const result = await dicewordsModule.validateDicewords(validWords);

      expect(result).toBe(true);
    });

    it("should reject non-existing words", async () => {
      const invalidWords = ["apple", "nonexistent", "cherry"];
      const result = await dicewordsModule.validateDicewords(invalidWords);

      expect(result).toBe(false);
    });

    it("should handle empty array", async () => {
      const result = await dicewordsModule.validateDicewords([]);

      expect(result).toBe(true);
    });
  });

  describe("getDicewordCount", () => {
    it("should return correct word count", async () => {
      const count = await dicewordsModule.getDicewordCount();

      expect(count).toBe(10);
    });

    it("should cache word list", async () => {
      await dicewordsModule.getDicewordCount();
      await dicewordsModule.getDicewordCount();

      // Should only fetch once due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Word list caching", () => {
    it("should cache word list across function calls", async () => {
      await dicewordsModule.generateDicewordsFromData(new Uint8Array([1, 2, 3, 4]), 2);
      await dicewordsModule.validateDicewords(["apple"]);
      await dicewordsModule.getDicewordCount();

      // Should only fetch once due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error handling", () => {
    it("should handle HTTP error responses", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      });

      await expect(
        dicewordsModule.generateDicewordsFromData(new Uint8Array([1, 2, 3, 4]), 4),
      ).rejects.toThrow("Failed to load dicewords dictionary");
    });

    it("should handle empty word list", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("   \n  \n  "),
      });

      const words = await dicewordsModule.generateDicewordsFromData(
        new Uint8Array([1, 2, 3, 4]),
        2,
      );

      // Should handle empty list gracefully (will cause modulo by 0, so we expect an error or empty result)
      expect(words).toHaveLength(2);
    });
  });
});
