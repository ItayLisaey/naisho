"use client";

import { parseAsStringEnum, useQueryState } from "nuqs";
import { RoleSelection } from "@/components/role-selection";
import { SessionContent } from "@/components/session-content";

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

  if (!role) {
    return <RoleSelection onRoleSelect={handleRoleSelect} />;
  }

  return (
    <SessionContent role={role as "writer" | "reader"} onBack={handleBack} />
  );
}
