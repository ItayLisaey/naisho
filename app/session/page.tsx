import { Suspense } from "react";
import SessionContent from "./client-page";

export default function SessionPage() {
  return (
    <Suspense>
      <SessionContent />
    </Suspense>
  );
}
