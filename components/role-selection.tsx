"use client";

import {
  ArrowDown,
  ArrowUp,
  AsteriskSquare,
  Code,
  HelpCircle,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { FlowDiagram } from "@/components/flow-diagram";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RoleSelectionProps {
  onRoleSelect: (role: "writer" | "reader") => void;
}

export function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-center p-4 pt-16 md:pt-24">
      <div className="md:max-w-4xl w-full max-w-[90%] mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <AsteriskSquare className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Naisho</h1>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <p className="text-xl text-muted-foreground">
              Confidently pass secrets, API keys, and environment variables
            </p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="How it works"
                >
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl! max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl sr-only">
                    How It Works: The Flow
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    See how Writer and Reader interact to securely share secrets
                  </DialogDescription>
                </DialogHeader>
                <FlowDiagram />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <Lock className="h-3 w-3" />
              End-to-End Encrypted
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              <Code className="h-3 w-3" />
              Open Source
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => onRoleSelect("writer")}
            className="flex-1 flex flex-col justify-center items-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl p-6 md:p-8 text-center transition-colors"
          >
            <ArrowUp className="size-10 mb-2" />
            <div className="text-2xl font-semibold mb-2">Share Secrets</div>
            <div className="text-sm opacity-90">
              Securely share API keys, tokens, or environment variables
            </div>
          </button>

          <button
            type="button"
            onClick={() => onRoleSelect("reader")}
            className="flex-1 flex flex-col justify-center items-center bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-2xl p-6 md:p-8 text-center transition-colors"
          >
            <ArrowDown className="size-10 mb-2" />
            <div className="text-2xl font-semibold mb-2">Receive Secrets</div>
            <div className="text-sm opacity-90">
              Safely receive shared credentials from a colleague
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
