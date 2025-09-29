# Security Whitepaper

**Understanding Naisho's Security Model**

## What's Protected

**End-to-End Encryption:** All message content is encrypted using WebRTC's built-in DTLS encryption. This means your messages are encrypted directly in your browser and can only be decrypted by your peer's browser. No server, network administrator, or third party can read your messages.

The encryption happens at the transport layer through the browser's WebRTC implementation, which uses industry-standard DTLS (Datagram Transport Layer Security) protocols.

## Peer Authentication

**Short Authentication String (SAS):** To ensure you're communicating with the intended person and not a man-in-the-middle attacker, Naisho uses a Short Authentication String derived from both peers' DTLS fingerprints.

The SAS is computed by:

1. Taking the DTLS fingerprints from both peers
2. Sorting them alphabetically to ensure consistent ordering
3. Computing SHA-256 of the concatenated fingerprints
4. Extracting 6 digits or **6 diceware words** from the hash

**Security Enhancement:** The system now generates 6 words (instead of 4) providing ~48 bits of entropy compared to the previous ~32 bits, significantly improving resistance against brute-force attacks.

**Critical:** You must compare this SAS code with your peer through a separate, trusted channel (like in person, phone call, or secure messaging). If the codes match, you can be confident you're communicating securely.

## Token Security

### Diceword Display System

**UX Innovation:** Naisho uses a revolutionary approach to make tokens human-shareable while maintaining security:

- **What you see:** 8 human-readable words like `"apple banana cherry dog elephant forest garden house"`
- **What gets copied:** Compressed base64url token like `"eyJ2IjoxLCJyb2xlIjoid3JpdGVyIiwic2RwT2ZmZXIi..."`
- **Security:** The dicewords are just a visual representation - the actual cryptographic token is what's transmitted

### Token Generation Process

1. **Create Token:** JSON object with WebRTC SDP + fingerprint + metadata
2. **Compress:** Use pako deflate compression to reduce size
3. **Encode:** Base64url encoding for safe transmission
4. **Display:** SHA-256 hash of compressed data → select 8 words from 7776-word dictionary
5. **Copy/Paste:** Copy button provides the functional base64url token

### Signaling Token Safety

The invite (O1) and answer (A1) tokens contain connection information but no message content. **Token TTL:** Invite tokens now expire after 3 minutes, significantly reducing the attack window.

Even if these tokens are intercepted or tampered with by an attacker:

- The attacker cannot read your messages (they're end-to-end encrypted)
- Any tampering will cause the SAS verification to fail
- You'll know something is wrong when your SAS codes don't match
- **Expired tokens** provide detailed error messages indicating how long ago they expired

This is why the SAS verification step is mandatory - it protects against tampering with the signaling process.

## Privacy Considerations

⚠️ **Important Privacy Notes:**

- **IP Addresses:** Your IP address will be visible to your peer through the direct connection
- **No Server Storage:** No messages or connection data are stored on any server
- **STUN Server:** We use Google's STUN server to help establish connections, which may log IP addresses
- **Diceword Display:** The display words are generated deterministically from the token data but cannot be used to recover the original token

## Threat Model

### ✓ Protected Against:

- Server-side message interception
- Network eavesdropping
- Man-in-the-middle attacks (with SAS verification)
- Signaling tampering (detected by SAS mismatch)
- Token format confusion (automatic detection and conversion)

### ⚠️ Not Protected Against:

- Compromised devices or browsers
- Screen sharing or keyloggers
- Users who skip SAS verification
- Traffic analysis (metadata about when you communicate)
- Social engineering attacks targeting diceword sharing

## Best Practices

1. **Always verify the SAS code** with your peer through a separate channel
2. **Use fresh tokens** for each session - don't reuse old invite tokens
3. **Share tokens carefully** through trusted channels when possible
4. **Be aware of your environment** - others may be able to see your screen
5. **Don't confuse dicewords with SAS codes** - they serve different purposes:
   - **Dicewords (8 words):** Human-readable token representation
   - **SAS codes (6 words or 6 digits):** Authentication verification

## Technical Implementation

### WebRTC Security

- **DTLS encryption** provides transport-layer security
- **SCTP over DTLS** for reliable data delivery
- **ICE/STUN** for NAT traversal (no TURN servers by default)
- **Data channel** labeled "txt" with ordered delivery

### Token Validation

- **Zod schemas** validate all token structures
- **TTL checking** for invite token expiration
- **Fingerprint extraction** from SDP for SAS computation
- **Dictionary validation** ensures display words exist in wordlist

### State Machine Security

- **Mandatory SAS confirmation** before allowing message exchange
- **Connection state monitoring** with automatic error handling
- **Token format validation** prevents pasting wrong token types
- **Sequence numbers** for message ordering and deduplication

### Security Headers (Extreme CSP)

**Content Security Policy:**
- `default-src 'self'` - Only same-origin resources allowed
- `connect-src 'self' wss: stun:` - WebRTC protocols specifically allowed
- `object-src 'none'` - No plugins or embeds
- `frame-ancestors 'none'` - Cannot be embedded in iframes

**Additional Hardening:**
- **HSTS** with preload for HTTPS enforcement
- **X-Frame-Options: DENY** prevents clickjacking
- **X-Content-Type-Options: nosniff** prevents MIME attacks
- **Permissions-Policy** disables all dangerous browser features
- Server headers removed for security through obscurity

### Testing & Validation

**Comprehensive Test Suite:**
- Token generation, expiration, and validation tests
- SAS computation consistency and security tests
- WebRTC utilities testing (mocked for reliability)
- Diceword generation and validation tests
- **Framework:** Vitest with Happy DOM for browser API simulation

## Future Enhancements

For additional defense-in-depth, future versions could implement:

- Pre-shared key (PSK) authentication for extra security
- Application-layer AEAD encryption on top of DTLS
- Perfect forward secrecy with rotating keys
- Optional TURN relay servers for NAT traversal
- Quantum-resistant cryptography preparation

---

This security model provides strong protection for most use cases while maintaining simplicity and excellent user experience through the innovative diceword display system.

For questions or security concerns, please review the source code on GitHub.