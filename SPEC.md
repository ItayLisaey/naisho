# High-level

- **Transport:** WebRTC DataChannel (DTLS/SCTP) → encrypted end-to-end by the browsers.
- **Authentication:** **Mandatory SAS comparison** (derived from both peers' DTLS fingerprints). If the codes match, you're talking directly to each other; a MitM would cause a mismatch.
- **Signaling:** Copy/paste tokens in an external chat (no server state).
- **Token UX:** **Diceword display system** - tokens shown as 8 readable words but copy as base64url for functionality.
- **UI:** Two pages; the session page is a **single wizard card** (token → connection → textarea).
- **No exports**; only **Copy** buttons.
- **Footer on all pages** with links to `/whitepaper` and GitHub.
- **State machine:** **XState** drives the wizard.

## Implementation Status

✅ **Fully implemented and functional** - All components, security features, and UX patterns are complete.

---

# Pages & layout

- `/` — **role select** (two big buttons: Start as Writer / Join as Reader).

  - Desktop: side-by-side; Mobile: stacked.

- `/session?role=writer|reader` — **session wizard card**.
- `/whitepaper` — short security explainer (DTLS + SAS).
- Global `footer.tsx` with links to `/whitepaper` and `NEXT_PUBLIC_GITHUB_URL`.

---

# Components (kebab-case)

```
/components
  session-card.tsx        // Wizard (XState)
  token-step.tsx          // O1/A1 token copy/paste
  connection-step.tsx     // Status + SAS verify
  textarea-step.tsx       // Live editor (flash on change)
  footer.tsx              // Global footer
```

---

# Wizard flow (single card)

**Order:** Token Panel → Connection → Textarea

## 1) token-step

- **Writer**

  - Button: **Generate invite (O1)** → shows **Invite Token** (mono textarea + Copy).
  - Input: **Paste Answer (A1)** → **Connect**.

- **Reader**

  - Input: **Paste Invite (O1)** → **Create Answer (A1)** → shows **Answer Token** (textarea + Copy back).

- Validates token schema & TTL; never sends to server.

## 2) connection-step

- **Status pill:** Disconnected / Connecting / Connected.
- **SAS (Short Authentication String)**:

  - 6 digits or 3 diceware words, computed from both DTLS fingerprints.
  - Prominent display + **Copy** button.
  - **Checkbox:** “I verified the code with my peer.” (Gate to proceed.)

- If SAS mismatch is reported by the peer (optional UI), offer **Restart** (regenerate O1).

## 3) textarea-step

- Writer: editable `<textarea>`.
- Reader: disabled `<textarea>`.
- **Flash effect:** On every applied local/remote change, add a **light-blue ring** for ~200 ms.

  - Example: temporarily apply `ring-2 ring-sky-300` with a tiny animation util.

---

# XState machine (simple)

States: `token → connection → textarea → error`

Events:

- `GENERATED_OFFER`, `GOT_ANSWER`, `CONNECTING`, `CONNECTED`, `SAS_CONFIRMED`, `ERROR`, `RETRY`

Guards:

- Only allow transition from `connection` to `textarea` after `CONNECTED` **and** `SAS_CONFIRMED`.

---

# WebRTC details (kept simple)

- **ICE:** Full gathering (single-shot tokens; no trickle in v1).
- **Servers:** STUN (`stun:stun.l.google.com:19302`); TURN optional (short-lived creds via `/api/turn`, if you choose to add it later).
- **DataChannel:** label `"txt"`, `{ ordered: true }`.
- **Messages:** plain JSON over the encrypted channel:

  - `full {seq, text}`
  - `patch {seq, from, to, text}`
  - `ack {upTo}`

- **Sequencing:** Reader discards `seq <= lastSeq`. Writer batches edits (120–200 ms), sends `full` if gaps/backlog.

---

# Token format (copy/paste)

## Diceword Display System

**UX Innovation:** Tokens are displayed as 8 human-readable dicewords but copy/paste as compressed base64url.

**Display Format:**
```
apple banana cherry dog elephant forest garden house
```

**Functional Format:** (Deflate + base64url - what gets copied/pasted)
```
eyJ2IjoxLCJyb2xlIjoid3JpdGVyIiwic2RwT2ZmZXIiOiJ2PTBcclxuby0...
```

## Token Schemas

**Offer (O1)**

```ts
{ v:1, role:'writer',
  sdpOffer:string,         // full ICE
  fp:string,               // writer DTLS fingerprint
  policy:{ peerIsReadOnly:true, ttlSec:number },
  ts:number
}
```

**Answer (A1)**

```ts
{ v:1, role:'reader',
  sdpAnswer:string,
  fp:string,               // reader DTLS fingerprint
  ackOf:string,            // sha256(raw O1 bytes)
  ts:number
}
```

## Token UX Flow

1. **Generation:** Create JSON → compress with pako → base64url encode
2. **Display:** Hash compressed data → select 8 dicewords from `/public/dicewords.txt`
3. **Copy:** Copy button copies the base64url token (functional format)
4. **Paste:** Auto-detects format and converts base64 → dicewords for display
5. **Validation:** Zod schemas + diceword dictionary validation
6. **TTL:** 3-minute expiration with detailed error messages

---

# SAS computation (simple & robust)

- Both sides compute:
  `sas = trunc6( SHA256( concat(min(fpW,fpR), ":", max(fpW,fpR)) ) )`
  (Sorting prevents role-ordering differences.)
- Present as **6 digits** (`000000–999999`) or **6 diceware words**.

**Why this works:** DTLS fingerprints are bound to the actual cryptographic keys of the connection. A MitM would terminate and re-originate DTLS, producing **different fingerprints** → **different SAS**. Human comparison defeats the attack.

**Security upgrade:** 6 words provides ~48 bits of entropy vs. previous 4 words (~32 bits), significantly improving attack resistance.

---

# Security model (plain English)

- **Confidentiality & integrity:** handled by **WebRTC DTLS** (browser-level E2E).
- **Peer authentication:** handled by **SAS verification** in the **Connection** step.
- **Signaling tamper:** harmless if users verify SAS; a tamperer can’t make SAS match both ends.
- **TURN relay:** only sees encrypted bytes (no plaintext).
- **Limits:** If users **skip SAS check**, they’re vulnerable to MitM. We make the checkbox mandatory to nudge the right behavior.

> This is **simple and secure** for a two-party app. If you ever need extra defense-in-depth (e.g., compliance), you can add a PSK toggle later and AEAD-wrap messages—without changing the UX much.

---

# Styling cues

- **Role select buttons:** large, rounded; side-by-side desktop; stacked mobile.
- **Card:** `max-w-2xl mx-auto rounded-2xl shadow p-6`.
- **Token textareas:** monospace, `h-40`, copy button.
- **Status pill:** muted; green/amber/red per state.
- **Textarea:** `h-[60vh] rounded-2xl p-4 font-mono`.
- **Flash:** transient `ring-2 ring-sky-300` on update.

---

# Footer

- On every page (`layout.tsx`), render `footer.tsx` with:

  - “Security whitepaper” → `/whitepaper`
  - “GitHub” → `NEXT_PUBLIC_GITHUB_URL`
  - Small text: “P2P via WebRTC. No server storage.”

---

# Whitepaper (concise)

- **What’s protected:** Content is E2E encrypted (DTLS).
- **How we authenticate:** SAS from fingerprints; humans compare.
- **Why tokens are safe:** Even if chat tampers with O1/A1, SAS fails → users will abort.
- **Privacy:** IPs are visible to peers; no data stored on server.
- **Optional future:** Add PSK + app-layer AEAD for defense-in-depth.

---

# Implementation Details

## Tech Stack

- **Framework:** Next.js 15 with Turbopack
- **State Management:** XState v5 for session wizard
- **UI:** shadcn/ui (New York style) + Radix UI primitives
- **Styling:** Tailwind CSS v4 with CSS variables
- **Compression:** pako (deflate/inflate for tokens)
- **Validation:** Zod schemas
- **Query State:** nuqs for URL state sync
- **Dev Tools:** Biome (linting + formatting)

## File Structure

```
/app
  layout.tsx              // Global layout + footer
  page.tsx               // Redirects to /session
  session/page.tsx       // Role selection + SessionCard
  whitepaper/page.tsx    // Security documentation

/components
  session-card.tsx       // Main wizard controller (XState)
  token-step.tsx         // Diceword token UI
  connection-step.tsx    // SAS verification
  textarea-step.tsx      // Live text editor
  footer.tsx             // Global footer
  /ui                    // shadcn/ui components

/lib
  session-machine.ts     // XState machine definition
  webrtc.ts             // WebRTC offer/answer/channels
  token.ts              // Token pack/unpack + dicewords
  sas.ts                // SAS computation
  dicewords.ts          // Diceword generation + validation
  utils.ts              // cn utility

/public
  dicewords.txt         // 7776-word dictionary for displays
```

## Testing Framework ✅

- **Framework:** Vitest with Happy DOM environment
- **Coverage:** Comprehensive test suites for all critical functions:
  - `token.test.ts`: Token generation, expiration, validation
  - `sas.test.ts`: SAS computation consistency and security
  - `webrtc.test.ts`: WebRTC utilities (mocked for unit tests)
  - `dicewords.test.ts`: Word generation and validation
- **Scripts:** `pnpm test`, `pnpm test:ui`, `pnpm test:coverage`
- **Mocking:** Crypto APIs, fetch, WebRTC for reliable unit tests

## Security Headers ✅

**Extreme CSP Implementation:**
- `default-src 'self'` - Only same-origin resources
- `connect-src 'self' wss: stun:` - WebRTC protocols allowed
- `script-src 'self' 'unsafe-inline'` - Next.js requirement
- `style-src 'self' 'unsafe-inline'` - Tailwind requirement
- `object-src 'none'` - No plugins/embeds
- `frame-ancestors 'none'` - No iframe embedding

**Additional Security Headers:**
- HSTS with preload for HTTPS enforcement
- X-Frame-Options: DENY (clickjacking protection)
- X-Content-Type-Options: nosniff (MIME sniffing protection)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: All dangerous features disabled
- Server header removed for security through obscurity

## Deliverables ✅

- **Pages:** `/`, `/session`, `/whitepaper`
- **Components:** All wizard steps + UI components implemented
- **Libs:** WebRTC, token system, SAS, dicewords, XState machine
- **Security:** End-to-end encryption + mandatory SAS verification + extreme CSP
- **UX:** Diceword display system for human-readable tokens
- **Testing:** Comprehensive Vitest test suite with coverage
- **TTL:** 3-minute token expiration with detailed error messages
- **No exports**; only **Copy** buttons
