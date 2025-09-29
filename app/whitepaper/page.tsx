export default function WhitepaperPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
        <h1 className="text-4xl font-bold text-center mb-8">
          Security Whitepaper
        </h1>

        <div className="text-xl text-muted-foreground text-center mb-12">
          Understanding Naisho's Security Model
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What's Protected</h2>
          <p className="text-lg leading-relaxed mb-4">
            <strong>End-to-End Encryption:</strong> All message content is
            encrypted using WebRTC's built-in DTLS encryption. This means your
            messages are encrypted directly in your browser and can only be
            decrypted by your peer's browser. No server, network administrator,
            or third party can read your messages.
          </p>
          <p className="text-lg leading-relaxed">
            The encryption happens at the transport layer through the browser's
            WebRTC implementation, which uses industry-standard DTLS (Datagram
            Transport Layer Security) protocols.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Peer Authentication</h2>
          <p className="text-lg leading-relaxed mb-4">
            <strong>Short Authentication String (SAS):</strong> To ensure you're
            communicating with the intended person and not a man-in-the-middle
            attacker, Naisho uses a Short Authentication String derived from
            both peers' DTLS fingerprints.
          </p>
          <p className="text-lg leading-relaxed mb-4">
            The SAS is computed by:
          </p>
          <ol className="list-decimal list-inside text-lg leading-relaxed mb-4 ml-4">
            <li>Taking the DTLS fingerprints from both peers</li>
            <li>Sorting them alphabetically to ensure consistent ordering</li>
            <li>Computing SHA-256 of the concatenated fingerprints</li>
            <li>Extracting 6 digits or 3 diceware words from the hash</li>
          </ol>
          <p className="text-lg leading-relaxed">
            <strong>Critical:</strong> You must compare this SAS code with your
            peer through a separate, trusted channel (like in person, phone
            call, or secure messaging). If the codes match, you can be confident
            you're communicating securely.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Token Security</h2>
          <p className="text-lg leading-relaxed mb-4">
            <strong>Signaling Token Safety:</strong> The invite (O1) and answer
            (A1) tokens contain connection information but no message content.
            Even if these tokens are intercepted or tampered with by an
            attacker:
          </p>
          <ul className="list-disc list-inside text-lg leading-relaxed mb-4 ml-4">
            <li>
              The attacker cannot read your messages (they're end-to-end
              encrypted)
            </li>
            <li>Any tampering will cause the SAS verification to fail</li>
            <li>
              You'll know something is wrong when your SAS codes don't match
            </li>
          </ul>
          <p className="text-lg leading-relaxed">
            This is why the SAS verification step is mandatory - it protects
            against tampering with the signaling process.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Privacy Considerations
          </h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
            <h3 className="font-semibold mb-2">⚠️ Important Privacy Notes:</h3>
            <ul className="list-disc list-inside leading-relaxed ml-4">
              <li>
                <strong>IP Addresses:</strong> Your IP address will be visible
                to your peer through the direct connection
              </li>
              <li>
                <strong>No Server Storage:</strong> No messages or connection
                data are stored on any server
              </li>
              <li>
                <strong>STUN Server:</strong> We use Google's STUN server to
                help establish connections, which may log IP addresses
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Threat Model</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-800 mb-2">
                ✓ Protected Against:
              </h3>
              <ul className="list-disc list-inside text-sm leading-relaxed ml-4">
                <li>Server-side message interception</li>
                <li>Network eavesdropping</li>
                <li>Man-in-the-middle attacks (with SAS verification)</li>
                <li>Signaling tampering (detected by SAS mismatch)</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-800 mb-2">
                ⚠️ Not Protected Against:
              </h3>
              <ul className="list-disc list-inside text-sm leading-relaxed ml-4">
                <li>Compromised devices or browsers</li>
                <li>Screen sharing or keyloggers</li>
                <li>Users who skip SAS verification</li>
                <li>Traffic analysis (metadata about when you communicate)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <ol className="list-decimal list-inside text-lg leading-relaxed ml-4">
            <li className="mb-2">
              <strong>Always verify the SAS code</strong> with your peer through
              a separate channel
            </li>
            <li className="mb-2">
              <strong>Use fresh tokens</strong> for each session - don't reuse
              old invite tokens
            </li>
            <li className="mb-2">
              <strong>Share tokens carefully</strong> through trusted channels
              when possible
            </li>
            <li className="mb-2">
              <strong>Be aware of your environment</strong> - others may be able
              to see your screen
            </li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Future Enhancements</h2>
          <p className="text-lg leading-relaxed mb-4">
            For additional defense-in-depth, future versions could implement:
          </p>
          <ul className="list-disc list-inside text-lg leading-relaxed ml-4">
            <li>Pre-shared key (PSK) authentication for extra security</li>
            <li>Application-layer AEAD encryption on top of DTLS</li>
            <li>Perfect forward secrecy with rotating keys</li>
            <li>Optional TURN relay servers for NAT traversal</li>
          </ul>
        </section>

        <div className="text-center text-muted-foreground border-t pt-8 mt-12">
          <p>
            This security model provides strong protection for most use cases
            while maintaining simplicity.
          </p>
          <p className="mt-2">
            For questions or security concerns, please review the source code on
            GitHub.
          </p>
        </div>
      </div>
    </div>
  );
}
