"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ConnectionDetails } from "@/components/connection-details";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { SASResult } from "@/lib/sas";
import { generateTokenDisplayWords, unpackToken } from "@/lib/token";
import { cn } from "@/lib/utils";
import type { WebRTCConnection } from "@/lib/webrtc";

interface ConnectionStepProps {
  connectionState: RTCPeerConnectionState;
  sas?: SASResult;
  sasConfirmed: boolean;
  onSasConfirmed: () => void;
  onRestart?: () => void;
  role: "writer" | "reader";
  answerToken?: string;
  connection?: WebRTCConnection;
}

export function ConnectionStep({
  connectionState,
  sas,
  sasConfirmed,
  onSasConfirmed,
  onRestart,
  role,
  answerToken,
  connection,
}: ConnectionStepProps) {
  const [copied, setCopied] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [optimisticSasConfirmed, setOptimisticSasConfirmed] = useState(false);
  const [displayWords, setDisplayWords] = useState<string[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState(false);

  // Generate display words for answerToken
  useEffect(() => {
    const generateWords = async () => {
      if (!answerToken) return;

      setIsLoadingWords(true);
      try {
        const tokenObj = unpackToken(answerToken);
        const words = await generateTokenDisplayWords(tokenObj);
        setDisplayWords(words);
      } catch (error) {
        console.error("Failed to generate display words:", error);
        setDisplayWords(["Error generating display words"]);
      } finally {
        setIsLoadingWords(false);
      }
    };

    generateWords();
  }, [answerToken]);

  const copyToClipboard = async (
    text: string,
    type: "sas" | "answer" = "sas",
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "sas") {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setCopiedAnswer(true);
        setTimeout(() => setCopiedAnswer(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleSasConfirmation = async () => {
    if (sasConfirmed || isVerifying) return;
    setOptimisticSasConfirmed(true);

    setIsVerifying(true);

    // Add a small delay for better UX
    setTimeout(() => {
      onSasConfirmed();
      setIsVerifying(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Connection</h2>
        <p className="text-muted-foreground">
          {role === "reader" && answerToken
            ? "Share your answer token with the writer and verify security code"
            : "Verify security code with your peer"}
        </p>
      </div>

      {role === "reader" && answerToken && (
        <div>
          <div className="text-left">
            <span className="text-base text-left font-medium">
              Answer Token{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                A1
              </span>
            </span>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Copy these 8 words and share them with your colleague to establish
              connection
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <div
                className={cn(
                  "text-center p-6 rounded-lg border-2 border-dashed",
                  "bg-muted/50 font-mono text-lg font-bold",
                  "border-gray-300",
                )}
              >
                {isLoadingWords
                  ? "Generating display words..."
                  : displayWords.join(" ")}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(answerToken || "", "answer")}
                disabled={isLoadingWords}
              >
                {copiedAnswer ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiedAnswer ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <ConnectionDetails
          connection={connection}
          connectionState={connectionState}
        />
      </div>

      {sas && (
        <div className="space-y-4">
          <div className="text-left">
            <span className="text-base text-left font-medium">
              Short Authentication String{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                SAS
              </span>
            </span>
            <p className="text-sm text-muted-foreground mt-1">
              Compare this code with your peer to ensure secure connection
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <div
                className={cn(
                  "text-center p-6 rounded-lg border-2 border-dashed",
                  "bg-muted/50 font-mono text-2xl font-bold",
                  connectionState === "connected" && sasConfirmed
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300",
                )}
              >
                {sas.words.join(" ")}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(sas.words.join(" "), "sas")}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sas-confirmed"
              checked={sasConfirmed || optimisticSasConfirmed}
              disabled={isVerifying || optimisticSasConfirmed}
              onCheckedChange={handleSasConfirmation}
            />
            <Label
              htmlFor="sas-confirmed"
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                isVerifying && "opacity-70",
              )}
            >
              I verified the code with my peer
            </Label>
            {isVerifying && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {connectionState === "connected" && sasConfirmed && (
            <div className="text-center text-sm text-green-600 font-medium">
              ✓ Secure connection established!
            </div>
          )}

          {(connectionState === "failed" ||
            connectionState === "disconnected") &&
            onRestart && (
              <div className="text-center">
                <Button onClick={onRestart} variant="outline">
                  Restart Connection
                </Button>
              </div>
            )}
        </div>
      )}

      {!sas && connectionState === "connecting" && (
        <div className="text-center text-muted-foreground">
          Establishing connection...
        </div>
      )}
    </div>
  );
}
