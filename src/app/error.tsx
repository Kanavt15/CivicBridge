"use client";
import { ErrorState } from "@/components/common";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState error="Please check the database connection and try again." retry={reset} />;
}
