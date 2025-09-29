import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  createAnswerToken,
  createOfferToken,
  generateTokenDisplayWords,
  getTokenExpirationError,
  isTokenExpired,
  unpackToken,
} from "../lib/token";

// Mock pako
jest.mock("pako", () => ({
  deflate: jest.fn((_data) => new Uint8Array([1, 2, 3, 4])),
  inflate: jest.fn(() => JSON.stringify({ test: "data" })),
}));

// Mock dicewords
jest.mock("../lib/dicewords", () => ({
  generateDicewordsFromData: jest.fn(() =>
    Promise.resolve([
      "test",
      "words",
      "display",
      "mock",
      "generated",
      "for",
      "token",
      "test",
    ]),
  ),
}));

describe("Token System", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createOfferToken", () => {
    it("should create valid offer token with default 3-minute TTL", () => {
      const token = createOfferToken("test-sdp", "test-fingerprint");

      expect(token.v).toBe(1);
      expect(token.role).toBe("writer");
      expect(token.sdpOffer).toBe("test-sdp");
      expect(token.fp).toBe("test-fingerprint");
      expect(token.policy.peerIsReadOnly).toBe(true);
      expect(token.policy.ttlSec).toBe(180); // 3 minutes
      expect(typeof token.ts).toBe("number");
      expect(token.ts).toBeCloseTo(Date.now(), -2); // Within 100ms
    });

    it("should accept custom TTL", () => {
      const customTtl = 60; // 1 minute
      const token = createOfferToken("test-sdp", "test-fingerprint", customTtl);

      expect(token.policy.ttlSec).toBe(customTtl);
    });
  });

  describe("createAnswerToken", () => {
    it("should create valid answer token", async () => {
      // Mock SHA-256 for ackOf calculation
      const mockHash = new ArrayBuffer(32);
      jest.mocked(crypto.subtle.digest).mockResolvedValue(mockHash);

      const token = await createAnswerToken(
        "answer-sdp",
        "answer-fp",
        "offer-token",
      );

      expect(token.v).toBe(1);
      expect(token.role).toBe("reader");
      expect(token.sdpAnswer).toBe("answer-sdp");
      expect(token.fp).toBe("answer-fp");
      expect(typeof token.ackOf).toBe("string");
      expect(typeof token.ts).toBe("number");
    });
  });

  describe("Token expiration", () => {
    it("should detect expired tokens", () => {
      // Create token that expired 1 hour ago
      const expiredToken = createOfferToken("test-sdp", "test-fp", 60);
      expiredToken.ts = Date.now() - 3600 * 1000; // 1 hour ago

      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it("should not expire fresh tokens", () => {
      const freshToken = createOfferToken("test-sdp", "test-fp", 180);

      expect(isTokenExpired(freshToken)).toBe(false);
    });

    it("should not expire answer tokens", async () => {
      const mockHash = new ArrayBuffer(32);
      jest.mocked(crypto.subtle.digest).mockResolvedValue(mockHash);

      const answerToken = await createAnswerToken(
        "answer-sdp",
        "answer-fp",
        "offer",
      );
      answerToken.ts = Date.now() - 3600 * 1000; // 1 hour ago

      expect(isTokenExpired(answerToken)).toBe(false);
    });

    it("should generate detailed expiration error", () => {
      const expiredToken = createOfferToken("test-sdp", "test-fp", 60);
      expiredToken.ts = Date.now() - 120 * 1000; // 2 minutes ago

      const error = getTokenExpirationError(expiredToken);
      expect(error).toContain("expired");
      expect(error).toContain("seconds ago");
      expect(error).toContain("generate a new invite token");
    });

    it("should return null for non-expired tokens", () => {
      const freshToken = createOfferToken("test-sdp", "test-fp", 180);

      const error = getTokenExpirationError(freshToken);
      expect(error).toBeNull();
    });
  });

  describe("Token validation", () => {
    it("should reject tokens with invalid format (6 words)", () => {
      const invalidToken = "word1 word2 word3 word4 word5 word6";

      expect(() => unpackToken(invalidToken)).toThrow("Invalid token format");
    });

    it("should reject tokens with invalid format (8 words)", () => {
      const invalidToken = "word1 word2 word3 word4 word5 word6 word7 word8";

      expect(() => unpackToken(invalidToken)).toThrow("Invalid token format");
    });
  });

  describe("Display words generation", () => {
    it("should generate 8 display words", async () => {
      const token = createOfferToken("test-sdp", "test-fp");
      const words = await generateTokenDisplayWords(token);

      expect(words).toHaveLength(8);
      expect(words).toEqual([
        "test",
        "words",
        "display",
        "mock",
        "generated",
        "for",
        "token",
        "test",
      ]);
    });
  });
});
