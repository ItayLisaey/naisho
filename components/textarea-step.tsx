"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextareaStepProps {
  role: "writer" | "reader";
  text: string;
  onTextChange?: (text: string) => void;
  connectionState: RTCPeerConnectionState;
}

export function TextareaStep({
  role,
  text,
  onTextChange,
  connectionState,
}: TextareaStepProps) {
  const [flash, setFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevTextRef = useRef(text);

  // Flash effect when text changes from external source (for both writer and reader)
  useEffect(() => {
    if (text !== prevTextRef.current) {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      prevTextRef.current = text;
    }
  }, [text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (role === "writer" && onTextChange) {
      onTextChange(e.target.value);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const isConnected = connectionState === "connected";
  const isDisabled = role === "reader" || !isConnected;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <h2 className="text-2xl font-semibold">
            {role === "writer" ? "Share Your Secrets" : "Received Secrets"}
          </h2>
        </div>
        <p className="text-muted-foreground">
          {role === "writer"
            ? "Type your secrets, API keys, or environment variables - they sync in real-time"
            : "Secrets shared with you appear here securely"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message-textarea" className="sr-only">
          Message content
        </Label>
        <div className="relative">
          {role === "reader" && (
            <Button
              onClick={handleCopy}
              size="sm"
              disabled={!text.trim()}
              variant="outline"
              className="flex items-center gap-2 absolute top-2 right-2"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          )}
          <Textarea
            id="message-textarea"
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            disabled={isDisabled}
            placeholder={
              role === "writer"
                ? isConnected
                  ? "Paste your API keys, environment variables, or other secrets here..."
                  : "Connect to start sharing..."
                : "Waiting for secrets from your colleague..."
            }
            className={cn(
              "h-[50vh] rounded-2xl p-4 font-mono text-sm resize-none transition-all duration-200",
              flash && "ring-2 ring-sky-300",
              isDisabled && "cursor-not-allowed opacity-75",
            )}
          />
        </div>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500",
            )}
          />
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>
    </div>
  );
}
