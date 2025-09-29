export function FlowDiagram() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Writer Column */}
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold">Writer</h3>
          <p className="text-sm text-muted-foreground">Share Secrets</p>
        </div>

        <div className="space-y-4">
          {/* Step 1: Writer generates invite */}
          <div className="bg-muted/50 p-5 rounded-lg border border-l-4 border-l-purple-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                1
              </span>
              <h4 className="font-semibold text-sm">Generate Invite Token</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                O1
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Click "Generate Invite" to create a WebRTC offer token with your
              connection details and fingerprint. Share the 8-word token with
              your colleague.
            </p>
          </div>

          {/* Step 2: Writer waits */}
          <div className="bg-muted/30 p-5 rounded-lg border border-dashed">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                2
              </span>
              <h4 className="font-semibold text-sm text-muted-foreground">
                Waiting for answer...
              </h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Wait for your colleague to paste their answer token.
            </p>
          </div>

          {/* Step 3: Writer pastes answer */}
          <div className="bg-muted/50 p-5 rounded-lg border border-l-4 border-l-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                3
              </span>
              <h4 className="font-semibold text-sm">Paste Answer Token</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                A1
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Paste the answer token from your colleague to establish the direct
              WebRTC connection.
            </p>
          </div>

          {/* Step 4: Writer verifies SAS */}
          <div className="bg-muted/50 p-5 rounded-lg border border-l-4 border-l-orange-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
                4
              </span>
              <h4 className="font-semibold text-sm">Verify Security Code</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                SAS
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Compare the 6-word security code with your colleague through a
              separate channel (phone, in person). Check the box when codes
              match.
            </p>
          </div>

          {/* Step 5: Writer shares secret */}
          <div className="bg-muted/50 p-5 rounded-lg border border-l-4 border-l-green-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                5
              </span>
              <h4 className="font-semibold text-sm">Share Secret</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Type your secret in the text area. It's encrypted end-to-end and
              sent directly to your colleague.
            </p>
          </div>
        </div>
      </div>

      {/* Reader Column */}
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold">Reader</h3>
          <p className="text-sm text-muted-foreground">Receive Secrets</p>
        </div>

        <div className="space-y-4">
          {/* Step 1: Reader waits */}
          <div className="bg-muted/30 p-5 rounded-lg border border-dashed">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                1
              </span>
              <h4 className="font-semibold text-sm text-muted-foreground">
                Waiting for invite...
              </h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Wait for your colleague to send you their invite token.
            </p>
          </div>

          {/* Step 2: Reader pastes invite */}
          <div className="bg-muted/50 p-5 rounded-lg border border-l-4 border-l-purple-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                2
              </span>
              <h4 className="font-semibold text-sm">Paste Invite Token</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                O1
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Paste the invite token from your colleague. Your browser will
              generate an answer token automatically.
            </p>
          </div>

          {/* Step 3: Reader shares answer */}
          <div className="bg-muted/50 p-5 rounded-lg border border-l-4 border-l-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                3
              </span>
              <h4 className="font-semibold text-sm">Share Answer Token</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                A1
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Copy the answer token and send it back to your colleague to
              complete the connection handshake.
            </p>
          </div>

          {/* Step 4: Reader verifies SAS */}
          <div className="bg-muted/50 p-5 rounded-lg border border-l-4 border-l-orange-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
                4
              </span>
              <h4 className="font-semibold text-sm">Verify Security Code</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                SAS
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Compare the 6-word security code with your colleague through a
              separate channel (phone, in person). Check the box when codes
              match.
            </p>
          </div>

          {/* Step 5: Reader receives secret */}
          <div className="bg-muted/50 p-5 rounded-lg border border-l-4 border-l-green-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                5
              </span>
              <h4 className="font-semibold text-sm">Receive Secret</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              View the secret in the text area. It arrives encrypted and is only
              decrypted in your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}