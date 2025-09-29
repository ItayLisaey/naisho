"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateTokenDisplayWords, unpackToken } from "@/lib/token";

interface TokenStepProps {
  role: "writer" | "reader";
  offerToken?: string;
  answerToken?: string;
  onGenerateOffer: () => void;
  onPasteAnswer: (token: string) => void;
  onCreateAnswer: (offerToken: string) => void;
  isGeneratingOffer?: boolean;
  isCreatingAnswer?: boolean;
  isAcceptingAnswer?: boolean;
}

// Reusable Loading Spinner Component
function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="text-center p-8">
      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
      {text && <p className="text-muted-foreground">{text}</p>}
    </div>
  );
}

// Copy Button with Success State
function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  size = "default",
  className,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  size?: "default" | "lg" | "sm";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <Button
      onClick={handleCopy}
      size={size}
      variant="outline"
      className={className}
    >
      {copied ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <Copy className="h-4 w-4 mr-2" />
      )}
      {copied ? copiedLabel : label}
    </Button>
  );
}

// Token Display Component for Generated Tokens
function _TokenDisplay({
  description,
  words,
  copyLabel,
  title,
}: {
  description: string;
  words: string[];
  copyLabel: string;
  title: string;
}) {
  return (
    <div className="space-y-3">
      <div className="text-left">
        <span className="text-base text-left font-medium">{title}</span>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="relative">
        <div className="text-center p-6 rounded-lg border-2 border-dashed border-gray-300 bg-muted/50 font-mono text-lg font-bold">
          {words.join(" ")}
        </div>
        <CopyButton
          text={words.join(" ")}
          label={copyLabel}
          copiedLabel="Copied to Clipboard!"
          size="sm"
          className="absolute bottom-2 right-2"
        />
      </div>
    </div>
  );
}

// Token Display Component that converts base64 tokens to display words
function TokenDisplayFromBase64({
  description,
  token,
  copyLabel,
  title,
}: {
  description: string;
  token: string;
  copyLabel: string;
  title: React.ReactNode;
}) {
  const [displayWords, setDisplayWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateWords = async () => {
      try {
        const tokenObj = unpackToken(token);
        const words = await generateTokenDisplayWords(tokenObj);
        setDisplayWords(words);
      } catch (error) {
        console.error("Failed to generate display words:", error);
        setDisplayWords(["Error generating display words"]);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      generateWords();
    }
  }, [token]);

  if (isLoading) {
    return <LoadingSpinner text="Generating display words..." />;
  }

  return (
    <div className="space-y-3">
      <div className="text-left">
        <span className="text-base text-left font-medium">{title}</span>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="relative">
        <div className="text-center p-6 rounded-lg border-2 border-dashed border-gray-300 bg-muted/50 font-mono text-lg font-bold">
          {displayWords.join(" ")}
        </div>
        <CopyButton
          text={token}
          label={copyLabel}
          copiedLabel="Copied to Clipboard!"
          size="sm"
          className="absolute bottom-2 right-2"
        />
      </div>
    </div>
  );
}

// Token Input Component for Pasting Tokens
function TokenInput({
  id,
  label,
  description,
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
  isLoading = false,
  loadingText,
}: {
  id: string;
  label: React.ReactNode;
  description: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (token: string) => void;
  placeholder: string;
  submitLabel: string;
  isLoading?: boolean;
  loadingText?: string;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [actualToken, setActualToken] = useState(value);
  const [isTranslating, setIsTranslating] = useState(false);

  // Auto-translate base64 tokens to display words
  const handlePaste = async (pastedText: string) => {
    const trimmed = pastedText.trim();

    // Check if it looks like a base64 token (not dicewords)
    const words = trimmed.split(/\s+/).filter((word) => word.length > 0);
    if (words.length !== 8 && trimmed.length > 20) {
      // Try to parse as base64 token
      try {
        setIsTranslating(true);
        const tokenObj = unpackToken(trimmed);
        const displayWords = await generateTokenDisplayWords(tokenObj);
        setDisplayValue(displayWords.join(" "));
        setActualToken(trimmed);
        onChange(trimmed);
        console.log(
          "Auto-translated base64 token to display words:",
          displayWords,
        );
      } catch (error) {
        console.log("Failed to parse as token, using raw input:", error);
        // If it fails, just use the raw input
        setDisplayValue(trimmed);
        setActualToken(trimmed);
        onChange(trimmed);
      } finally {
        setIsTranslating(false);
      }
    } else {
      // Already looks like dicewords or short text, use as is
      console.log("Using raw input (looks like dicewords or short text)");
      setDisplayValue(trimmed);
      setActualToken(trimmed);
      onChange(trimmed);
    }
  };

  const handleChange = (newValue: string) => {
    setDisplayValue(newValue);
    setActualToken(newValue);
    onChange(newValue);
  };

  const handleSubmit = () => {
    onSubmit(actualToken);
  };

  // Sync with external value changes
  useEffect(() => {
    if (value !== actualToken) {
      setDisplayValue(value);
      setActualToken(value);
    }
  }, [value, actualToken]);

  const isValidToken = actualToken.trim().length > 0;

  return (
    <div>
      <div className="text-left">
        <span className="text-base text-left font-medium">{label}</span>
        <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
      </div>
      <div className="space-y-2">
        <Textarea
          id={id}
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          onPaste={(e) => {
            console.log("Paste event fired");
            e.preventDefault();
            const pastedText = e.clipboardData.getData("text");
            console.log("Pasted text:", pastedText);
            handlePaste(pastedText);
          }}
          placeholder={placeholder}
          className="font-mono h-32"
        />
        {isTranslating && (
          <p className="text-sm text-muted-foreground">
            Converting token to display words...
          </p>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!isValidToken || isLoading}
          className="w-full"
        >
          {isLoading && loadingText ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              {loadingText}
            </div>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </div>
  );
}

// Writer Token Flow Component
function WriterTokenFlow({
  offerToken,
  onGenerateOffer,
  onPasteAnswer,
  isGeneratingOffer,
  isAcceptingAnswer,
}: {
  offerToken?: string;
  onGenerateOffer: () => void;
  onPasteAnswer: (token: string) => void;
  isGeneratingOffer: boolean;
  isAcceptingAnswer: boolean;
}) {
  const [pastedToken, setPastedToken] = useState("");

  const handleConnect = (token: string) => {
    onPasteAnswer(token);
    setPastedToken("");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Share Secrets</h2>
        <p className="text-muted-foreground">
          Generate an invite token for your colleague
        </p>
      </div>

      {!offerToken && !isGeneratingOffer ? (
        <div className="text-center">
          <Button onClick={onGenerateOffer} size="lg" className="px-8">
            Generate Invite{" "}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 ml-2">
              O1
            </span>
          </Button>
        </div>
      ) : isGeneratingOffer ? (
        <LoadingSpinner text="Generating secure invite token..." />
      ) : (
        <div className="space-y-4">
          <TokenDisplayFromBase64
            description="Your invite token has been generated and is ready to share with your colleague."
            token={offerToken || ""}
            copyLabel="Copy Invite"
            title={
              <>
                Invite Token{" "}
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                  O1
                </span>
              </>
            }
          />

          <TokenInput
            id="answer-token"
            label={
              <>
                Paste Answer{" "}
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                  A1
                </span>
              </>
            }
            description="Paste the answer token from your colleague here. It will automatically convert to readable words."
            value={pastedToken}
            onChange={setPastedToken}
            onSubmit={handleConnect}
            placeholder="Paste the answer token from your colleague here..."
            submitLabel="Connect"
            isLoading={isAcceptingAnswer}
            loadingText="Connecting..."
          />
        </div>
      )}
    </div>
  );
}

// Reader Token Flow Component
function ReaderTokenFlow({
  answerToken,
  onCreateAnswer,
  isCreatingAnswer,
}: {
  answerToken?: string;
  onCreateAnswer: (offerToken: string) => void;
  isCreatingAnswer: boolean;
}) {
  const [pastedToken, setPastedToken] = useState("");

  const handleConnect = (token: string) => {
    onCreateAnswer(token);
    setPastedToken("");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Receive Secrets</h2>
        <p className="text-muted-foreground">
          Paste the invite token from your colleague
        </p>
      </div>

      {!answerToken ? (
        <TokenInput
          id="invite-token"
          label={
            <>
              Paste Invite{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                O1
              </span>
            </>
          }
          description="Paste the invite token from your colleague here. It will automatically convert to readable words."
          value={pastedToken}
          onChange={setPastedToken}
          onSubmit={handleConnect}
          placeholder="Paste the invite token from your colleague here..."
          submitLabel="Create Answer"
          isLoading={isCreatingAnswer}
          loadingText="Creating Answer..."
        />
      ) : (
        <TokenDisplayFromBase64
          description="Your answer token has been created. Copy it and share it back with your colleague."
          token={answerToken || ""}
          copyLabel="Copy Answer"
          title={
            <>
              Answer Token{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                A1
              </span>
            </>
          }
        />
      )}
    </div>
  );
}

export function TokenStep({
  role,
  offerToken,
  answerToken,
  onGenerateOffer,
  onPasteAnswer,
  onCreateAnswer,
  isGeneratingOffer = false,
  isCreatingAnswer = false,
  isAcceptingAnswer = false,
}: TokenStepProps) {
  if (role === "writer") {
    return (
      <WriterTokenFlow
        offerToken={offerToken}
        onGenerateOffer={onGenerateOffer}
        onPasteAnswer={onPasteAnswer}
        isGeneratingOffer={isGeneratingOffer}
        isAcceptingAnswer={isAcceptingAnswer}
      />
    );
  }

  return (
    <ReaderTokenFlow
      answerToken={answerToken}
      onCreateAnswer={onCreateAnswer}
      isCreatingAnswer={isCreatingAnswer}
    />
  );
}
