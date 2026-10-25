"use client";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { problemTransitions, proposalTransitions } from "@/lib/domain";
import { label } from "@/lib/utils";
import { Button } from "./ui/button";
export function StatusControl({
  type,
  id,
  status,
  onUpdate,
  limited = false,
}: {
  type: "problems" | "proposals";
  id: string;
  status: string;
  onUpdate: () => void;
  limited?: boolean;
}) {
  const [next, setNext] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false);
  const options =
    (type === "problems" ? problemTransitions : proposalTransitions)[status]?.filter(
      (v) => !limited || ["UNDER_REVIEW", "SHORTLISTED", "REJECTED"].includes(v),
    ) ?? [];
  async function change(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`${type}/${id}/status`, "PATCH", { status: next, note });
      toast.success("Status updated. The contributor has been notified.");
      setNext("");
      setNote("");
      onUpdate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!options.length) return <p className="muted">This workflow has no further review actions.</p>;
  return (
    <form className="form-stack" onSubmit={change}>
      <label className="field">
        Move to
        <select value={next} onChange={(e) => setNext(e.target.value)} required>
          <option value="">Select next status</option>
          {options.map((v) => (
            <option key={v} value={v}>
              {label(v)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Review note
        <textarea
          value={note}
          maxLength={2000}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Explain the decision for the contributor."
        />
      </label>
      <Button type="submit" disabled={!next || busy}>
        {busy ? "Updating…" : "Update status"}
      </Button>
    </form>
  );
}
