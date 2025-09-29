import { deflate, inflate } from "pako";
import { z } from "zod";
import { generateDicewordsFromData } from "./dicewords";

const OfferTokenSchema = z.object({
  v: z.number(),
  role: z.literal("writer"),
  sdpOffer: z.string(),
  fp: z.string(),
  policy: z.object({
    peerIsReadOnly: z.boolean(),
    ttlSec: z.number(),
  }),
  ts: z.number(),
});

const AnswerTokenSchema = z.object({
  v: z.number(),
  role: z.literal("reader"),
  sdpAnswer: z.string(),
  fp: z.string(),
  ackOf: z.string(),
  ts: z.number(),
});

const TokenSchema = z.union([OfferTokenSchema, AnswerTokenSchema]);

export type OfferToken = z.infer<typeof OfferTokenSchema>;
export type AnswerToken = z.infer<typeof AnswerTokenSchema>;
export type Token = z.infer<typeof TokenSchema>;

export function createOfferToken(
  sdpOffer: string,
  fingerprint: string,
  ttlSec: number = 180,
): OfferToken {
  return {
    v: 1,
    role: "writer",
    sdpOffer,
    fp: fingerprint,
    policy: {
      peerIsReadOnly: true,
      ttlSec,
    },
    ts: Date.now(),
  };
}

export async function createAnswerToken(
  sdpAnswer: string,
  fingerprint: string,
  offerTokenRaw: string,
): Promise<AnswerToken> {
  const ackOf = await sha256(new TextEncoder().encode(offerTokenRaw));

  return {
    v: 1,
    role: "reader",
    sdpAnswer,
    fp: fingerprint,
    ackOf,
    ts: Date.now(),
  };
}

export function packToken(token: Token): string {
  const json = JSON.stringify(token);
  const compressed = deflate(json);
  return base64urlEncode(compressed);
}

export function unpackToken(packedToken: string): Token {
  try {
    // Check if token format is invalid
    const cleanToken = packedToken.trim();
    if (/^[a-z]+(\s+[a-z]+){5,7}$/i.test(cleanToken)) {
      throw new Error("Invalid token format");
    }

    // Check if user pasted dicewords (8 words)
    const words = cleanToken.split(/\s+/);
    if (words.length === 8) {
      throw new Error("Invalid token format");
    }

    const compressed = base64urlDecode(cleanToken);
    const json = inflate(compressed, { to: "string" });
    const parsedData = JSON.parse(json);

    // Use Zod to parse and validate the token
    const token = TokenSchema.parse(parsedData);
    return token;
  } catch (error) {
    console.error("Token unpacking error:", error);
    console.error("Packed token:", packedToken);

    if (
      error instanceof Error &&
      error.message.includes("Invalid token format")
    ) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid token format: ${error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
      );
    }

    throw new Error(
      `Failed to unpack token: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export function isValidToken(obj: unknown): obj is Token {
  try {
    TokenSchema.parse(obj);
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Token validation failed:", error.issues);
    } else {
      console.error("Token validation failed:", error);
    }
    return false;
  }
}

export function isTokenExpired(token: Token): boolean {
  if (token.role === "writer") {
    const ttlMs = token.policy.ttlSec * 1000;
    return Date.now() > token.ts + ttlMs;
  }
  // Answer tokens don't have TTL
  return false;
}

export function getTokenExpirationError(token: Token): string | null {
  if (token.role === "writer" && isTokenExpired(token)) {
    const ttlMs = token.policy.ttlSec * 1000;
    const expirationTime = new Date(token.ts + ttlMs);
    const now = new Date();
    const timeDiff = Math.round(
      (now.getTime() - expirationTime.getTime()) / 1000,
    );

    return `Invite token has expired ${timeDiff} seconds ago. Please generate a new invite token.`;
  }
  return null;
}

function base64urlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(data: string): Uint8Array {
  try {
    // Clean the input string
    const cleanData = data.trim().replace(/\s/g, "");

    // Convert base64url to base64
    let base64 = cleanData.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if needed
    const padLength = 4 - (base64.length % 4);
    if (padLength < 4) {
      base64 += "=".repeat(padLength);
    }

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error("Base64 decode error:", error);
    console.error("Input data:", data);
    throw new Error(
      `Invalid base64url encoding: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

async function sha256(data: Uint8Array): Promise<string> {
  // Create a new Uint8Array with a proper ArrayBuffer
  const buffer = new ArrayBuffer(data.length);
  const view = new Uint8Array(buffer);
  view.set(data);

  const hashBuffer = await crypto.subtle.digest("SHA-256", view);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Token display functions - generate human-readable words for display only
export async function generateTokenDisplayWords(
  token: Token,
): Promise<string[]> {
  const packedToken = packToken(token);
  const compressed = base64urlDecode(packedToken);

  // Generate 8 display words from the compressed token data
  return await generateDicewordsFromData(compressed, 8);
}
