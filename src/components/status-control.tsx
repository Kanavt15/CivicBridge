"use client";
import { Select, Textarea } from "@/components/localized-fields";
import { Text } from "@/components/i18n";

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
  if (!options.length)
    return (
      <p className="muted">
        <Text>{"This workflow has no further review actions."}</Text>
      </p>
    );
  return (
    <form className="form-stack" onSubmit={change}>
      <label className="field">
        <Text>{"Move to"}</Text>
        <Select value={next} onChange={(e) => setNext(e.target.value)} required>
          <option value="">
            <Text>{"Select next status"}</Text>
          </option>
          {options.map((v) => (
            <option key={v} value={v}>
              <Text>{label(v)}</Text>
            </option>
          ))}
        </Select>
      </label>
      <label className="field">
        <Text>{"Review note"}</Text>
        <Textarea
          value={note}
          maxLength={2000}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Explain the decision for the contributor."
        />
      </label>
      <Button type="submit" disabled={!next || busy}>
        <Text>{busy ? "Updating…" : "Update status"}</Text>
      </Button>
    </form>
  );
}
