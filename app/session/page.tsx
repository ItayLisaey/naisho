"use client";

import { ArrowLeft, AsteriskSquare } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useEffect } from "react";
import { SessionCard } from "@/components/session-card";
import { Button } from "@/components/ui/button";

function RoleSelection({
  onRoleSelect,
}: {
  onRoleSelect: (role: "writer" | "reader") => void;
}) {
  return (
    <div className=" flex items-center justify-center p-4 pt-24">
      <div className="md:max-w-4xl w-full max-w-[90%] mx-auto">
        <div className="text-center mb-12 ">
          <div className="flex items-center justify-center gap-2 mb-4">
            <AsteriskSquare className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Naisho</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Confidently pass secrets, API keys, and environment variables
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => onRoleSelect("writer")}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl p-8 text-center transition-colors"
          >
            <div className="text-2xl font-semibold mb-2">Share Secrets</div>
            <div className="text-sm opacity-90">
              Securely share API keys, tokens, or environment variables
            </div>
          </button>

          <button
            type="button"
            onClick={() => onRoleSelect("reader")}
            className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-2xl p-8 text-center transition-colors"
          >
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

function SessionContent({
  role,
  onBack,
}: {
  role: "writer" | "reader";
  onBack: () => void;
}) {
  return (
    <div className=" flex items-center justify-center p-4">
      <div className="md:max-w-4xl w-full max-w-[90%] mx-auto">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <SessionCard role={role} />
      </div>
    </div>
  );
}

export default function SessionPage() {
  const [role, setRole] = useQueryState(
    "role",
    parseAsStringEnum(["writer", "reader"]),
  );

  const handleRoleSelect = (selectedRole: "writer" | "reader") => {
    setRole(selectedRole);
  };

  const handleBack = () => {
    setRole(null);
  };

  useEffect(() => {
    const handlePopState = () => {
      // Handle browser back/forward
      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get("role");
      if (!urlRole || !["writer", "reader"].includes(urlRole)) {
        setRole(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setRole]);

  if (!role) {
    return <RoleSelection onRoleSelect={handleRoleSelect} />;
  }

  return (
    <SessionContent role={role as "writer" | "reader"} onBack={handleBack} />
  );
}
