import { Button } from "@/components/ui/button";
import { AlertTriangle, AsteriskSquare } from "lucide-react";
import Link from "next/link";
import { FlowDiagram } from "@/components/flow-diagram";

export default function WhitepaperPage() {
  return (
    <div className='min-h-screen py-12 px-4'>
      <div className='max-w-2xl mx-auto'>
        <div className='flex items-center gap-3 mb-4'>
          <Button variant='ghost' className='h-16 w-16 px-0 py-0' asChild>
            <Link href='/'>
              <AsteriskSquare className='size-12' />
            </Link>
          </Button>
          <h1 className='text-4xl font-bold'>Security Whitepaper</h1>
        </div>

        <div className='text-xl text-muted-foreground mb-8'>
          Understanding Naisho's Security Model
        </div>

        <section className='mb-8'>
          <p className='text-lg leading-relaxed mb-4'>
            <strong>End-to-End Encryption:</strong> All message content is
            encrypted using WebRTC's built-in DTLS encryption. This means your
            messages are encrypted directly in your browser and can only be
            decrypted by your peer's browser. No server, network administrator,
            or third party can read your messages.
          </p>
          <p className='text-lg leading-relaxed'>
            The encryption happens at the transport layer through the browser's
            WebRTC implementation, which uses industry-standard DTLS (Datagram
            Transport Layer Security) protocols.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl text-center font-semibold mb-4'>
            How It Works: The Flow
          </h2>

          <FlowDiagram />
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4 text-center'>
            Peer Authentication
          </h2>
          <p className='text-lg leading-relaxed mb-4'>
            <strong>Short Authentication String</strong>{" "}
            <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800'>
              SAS
            </span>
            : To ensure you're communicating with the intended person and not a
            man-in-the-middle attacker, Naisho uses a Short Authentication
            String derived from both peers' DTLS fingerprints.
          </p>
          <p className='text-lg leading-relaxed mb-4'>
            The SAS is computed by:
          </p>
          <ol className='list-decimal list-inside text-lg leading-relaxed mb-4 ml-4'>
            <li>Taking the DTLS fingerprints from both peers</li>
            <li>Sorting them alphabetically to ensure consistent ordering</li>
            <li>Computing SHA-256 of the concatenated fingerprints</li>
            <li>
              Extracting <strong>6 diceware words</strong> from the hash
            </li>
          </ol>

          <p className='text-lg leading-relaxed bg-red-50 border border-red-200 p-4 rounded-lg'>
            <AlertTriangle className='size-6  inline-block mr-2 text-red-400' />
            You must compare this SAS code with your peer through a separate,
            trusted channel (like in person, phone call, or secure messaging).
            If the codes match, you can be confident you're communicating
            securely.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4 text-center'>
            Token Security
          </h2>

          <h3 className='text-xl font-semibold mb-3'>
            Diceword Display System
          </h3>
          <p className='text-lg leading-relaxed mb-4'>
            Naisho uses a nice trick to make tokens human-shareable while
            maintaining security:
          </p>
          <ul className='list-disc list-inside text-lg leading-relaxed mb-6 ml-4'>
            <li>
              <strong>What you see:</strong> 8 human-readable words like{" "}
              <code className='text-sm bg-muted px-1.5 py-0.5 rounded'>
                apple banana cherry dog elephant forest garden house
              </code>
            </li>
            <li>
              <strong>What gets copied:</strong> Compressed base64url token like{" "}
              <code className='text-xs bg-muted px-1.5 py-0.5 rounded'>
                eyJ2IjoxLCJyb2xlIjoid3JpdGVyIiwic2RwT2ZmZXIi...
              </code>
            </li>
            <li>
              <strong>Security:</strong> The dicewords are just a visual
              representation - the actual cryptographic token is what's
              transmitted
            </li>
          </ul>

          <h3 className='text-xl font-semibold mb-3'>Signaling Token Safety</h3>
          <p className='text-lg leading-relaxed mb-4'>
            The invite{" "}
            <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800'>
              O1
            </span>{" "}
            and answer{" "}
            <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800'>
              A1
            </span>{" "}
            tokens contain connection information but no message content.
          </p>
          <p className='text-lg leading-relaxed mb-4'>
            <strong>Token TTL:</strong> Invite tokens expire after 3 minutes,
            significantly reducing the attack window.
          </p>
          <p className='text-lg leading-relaxed mb-4'>
            Even if these tokens are intercepted or tampered with by an
            attacker:
          </p>
          <ul className='list-disc list-inside text-lg leading-relaxed mb-4 ml-4'>
            <li>
              The attacker cannot read your messages (they're end-to-end
              encrypted)
            </li>
            <li>Any tampering will cause the SAS verification to fail</li>
            <li>
              You'll know something is wrong when your SAS codes don't match
            </li>
            <li>
              <strong>Expired tokens</strong> provide detailed error messages
              indicating how long ago they expired
            </li>
          </ul>
          <p className='text-lg leading-relaxed'>
            This is why the SAS verification step is mandatory - it protects
            against tampering with the signaling process.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4 text-center'>
            Privacy Considerations
          </h2>
          <div className='bg-muted/30 border border-muted rounded-lg p-6 mb-4'>
            <ul className='space-y-3 text-base leading-relaxed'>
              <li className='flex gap-3'>
                <span className='text-muted-foreground mt-0.5'>•</span>
                <span>
                  <strong>IP Addresses:</strong> Your IP address will be visible
                  to your peer through the direct connection
                </span>
              </li>
              <li className='flex gap-3'>
                <span className='text-muted-foreground mt-0.5'>•</span>
                <span>
                  <strong>No Server Storage:</strong> No messages or connection
                  data are stored on any server
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4 text-center'>
            Threat Model
          </h2>

          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold mb-4 text-green-700 dark:text-green-400'>
                What Naisho Protects Against
              </h3>
              <div className='space-y-4'>
                <div className='border-l-2 border-green-500 pl-4'>
                  <h4 className='font-semibold mb-1'>Network-Level Attacks</h4>
                  <p className='text-sm text-muted-foreground'>
                    All data is encrypted end-to-end using DTLS. Even if an
                    attacker intercepts network traffic, they cannot decrypt the
                    message content without breaking modern cryptography.
                  </p>
                </div>
                <div className='border-l-2 border-green-500 pl-4'>
                  <h4 className='font-semibold mb-1'>
                    Man-in-the-Middle Attacks
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    The mandatory SAS verification ensures both parties are
                    connected to each other and not an attacker. Any tampering
                    with connection details causes SAS codes to mismatch,
                    immediately alerting users.
                  </p>
                </div>
                <div className='border-l-2 border-green-500 pl-4'>
                  <h4 className='font-semibold mb-1'>Server-Side Compromise</h4>
                  <p className='text-sm text-muted-foreground'>
                    No servers ever see your message content. The connection is
                    peer-to-peer, and even if Naisho's infrastructure were
                    compromised, attackers would gain no access to secrets.
                  </p>
                </div>
                <div className='border-l-2 border-green-500 pl-4'>
                  <h4 className='font-semibold mb-1'>Token Replay Attacks</h4>
                  <p className='text-sm text-muted-foreground'>
                    Invite tokens expire after 3 minutes, limiting the window
                    for replay attacks. Old tokens are automatically rejected
                    with clear error messages.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className='text-lg font-semibold mb-4 text-red-700 dark:text-red-400'>
                What Naisho Cannot Protect Against
              </h3>
              <div className='space-y-4'>
                <div className='border-l-2 border-red-500 pl-4'>
                  <h4 className='font-semibold mb-1'>Endpoint Compromise</h4>
                  <p className='text-sm text-muted-foreground'>
                    If your device or browser is compromised (malware,
                    keyloggers, remote access), the attacker can see everything
                    you see. Naisho's encryption happens in the browser, so it
                    cannot protect against threats that have already compromised
                    your endpoint.
                  </p>
                </div>
                <div className='border-l-2 border-red-500 pl-4'>
                  <h4 className='font-semibold mb-1'>Social Engineering</h4>
                  <p className='text-sm text-muted-foreground'>
                    An attacker who convinces you to share tokens with them or
                    skip SAS verification can impersonate your intended peer.
                    Always verify the SAS code through a trusted out-of-band
                    channel.
                  </p>
                </div>
                <div className='border-l-2 border-red-500 pl-4'>
                  <h4 className='font-semibold mb-1'>Physical Surveillance</h4>
                  <p className='text-sm text-muted-foreground'>
                    Screen sharing, shoulder surfing, or cameras can expose
                    secrets as you type them. Be aware of your physical
                    environment when handling sensitive information.
                  </p>
                </div>
                <div className='border-l-2 border-red-500 pl-4'>
                  <h4 className='font-semibold mb-1'>Traffic Analysis</h4>
                  <p className='text-sm text-muted-foreground'>
                    While message content is encrypted, metadata like connection
                    timing, duration, and the fact that two IP addresses are
                    communicating is visible to network observers. Naisho does
                    not provide anonymity or hide communication patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className='text-center text-muted-foreground border-t pt-8 mt-12'>
          <p className='mt-2'>
            For questions or security concerns, please review the source code on
            GitHub.
          </p>
        </div>
      </div>
    </div>
  );
}
