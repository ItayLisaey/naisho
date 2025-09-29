import { ArrowLeft } from "lucide-react";
import { SessionCard } from "@/components/session-card";
import { Button } from "@/components/ui/button";

interface SessionContentProps {
  role: "writer" | "reader";
  onBack: () => void;
}

export function SessionContent({ role, onBack }: SessionContentProps) {
  return (
    <div className="flex items-center justify-center p-4">
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
