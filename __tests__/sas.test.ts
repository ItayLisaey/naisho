import { beforeEach, describe, expect, it } from "@jest/globals";

// Mock fetch for dicewords
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock SHA-256
const mockDigest = jest.fn();
Object.defineProperty(globalThis, "crypto", {
  value: {
    subtle: {
      digest: mockDigest,
    },
  },
});

describe("SAS (Short Authentication String)", () => {
  let sasModule: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    // Re-import the module to reset the cached dicewords
    sasModule = await import("../lib/sas");

    // Mock dicewords.txt fetch
    mockFetch.mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          "apple\nbanana\ncherry\ndog\nelephant\nforest\ngarden\nhouse",
        ),
    });

    // Mock SHA-256 to return predictable hash
    const mockHashArray = new Uint8Array([
      0x02,
      0xf0,
      0x86, // For digits: (0x02 << 16) | (0xF0 << 8) | 0x86 = 193046, 193046 % 1000000 = 193046
      0x00,
      0x01, // word1: index 1 -> "banana"
      0x00,
      0x02, // word2: index 2 -> "cherry"
      0x00,
      0x03, // word3: index 3 -> "dog"
      0x00,
      0x04, // word4: index 4 -> "elephant"
      0x00,
      0x05, // word5: index 5 -> "forest"
      0x00,
      0x06, // word6: index 6 -> "garden"
    ]);
    mockDigest.mockResolvedValue(mockHashArray.buffer);
  });

  it("should generate consistent SAS for same fingerprints", async () => {
    const fp1 = "AA:BB:CC:DD:EE:FF";
    const fp2 = "11:22:33:44:55:66";

    const sas1 = await sasModule.computeSAS(fp1, fp2);
    const sas2 = await sasModule.computeSAS(fp1, fp2);

    expect(sas1).toEqual(sas2);
  });

  it("should generate same SAS regardless of fingerprint order", async () => {
    const fp1 = "AA:BB:CC:DD:EE:FF";
    const fp2 = "11:22:33:44:55:66";

    const sas1 = await sasModule.computeSAS(fp1, fp2);
    const sas2 = await sasModule.computeSAS(fp2, fp1);

    expect(sas1).toEqual(sas2);
  });

  it("should generate 6-digit code", async () => {
    const sas = await sasModule.computeSAS("fp1", "fp2");

    expect(sas.digits).toMatch(/^\d{6}$/);
    expect(sas.digits).toBe("192646"); // (0x02 << 16) | (0xF0 << 8) | 0x86 = 192646
  });

  it("should generate 6 words", async () => {
    const sas = await sasModule.computeSAS("fp1", "fp2");

    expect(sas.words).toHaveLength(6);
    expect(sas.words).toEqual([
      "banana", // index 1
      "cherry", // index 2
      "dog", // index 3
      "elephant", // index 4
      "forest", // index 5
      "garden", // index 6
    ]);
  });

  it("should handle fetch errors gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    await expect(sasModule.computeSAS("fp1", "fp2")).rejects.toThrow(
      "Failed to load dicewords dictionary for SAS generation",
    );
  });

  it("should cache dicewords after first load", async () => {
    await sasModule.computeSAS("fp1", "fp2");
    await sasModule.computeSAS("fp3", "fp4");

    // Fetch should only be called once due to caching
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should generate different SAS for different fingerprints", async () => {
    const sas1 = await sasModule.computeSAS("fp1", "fp2");

    // Mock different hash for different fingerprints
    const differentHashArray = new Uint8Array([
      0x78,
      0x9a,
      0xbc, // Different digits
      0x00,
      0x07, // Different word indices
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x02,
      0x00,
      0x03,
      0x00,
      0x04,
    ]);
    mockDigest.mockResolvedValue(differentHashArray.buffer);

    const sas2 = await sasModule.computeSAS("fp3", "fp4");

    expect(sas1.digits).not.toBe(sas2.digits);
    expect(sas1.words).not.toEqual(sas2.words);
  });
});
