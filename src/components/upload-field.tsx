"use client";
import { UploadCloud, FileCheck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
export function UploadField({
  files,
  onChange,
  documents = false,
}: {
  files: { id: string; name: string }[];
  onChange: (files: { id: string; name: string }[]) => void;
  documents?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (files.length + selected.length > (documents ? 3 : 4)) {
      toast.error(`Attach at most ${documents ? 3 : 4} files.`);
      return;
    }
    setBusy(true);
    const created = [...files];
    try {
      for (const file of selected) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Each file must be smaller than 5 MB.");
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        created.push(data);
        onChange([...created]);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }
  return (
    <div>
      <div className="upload-zone">
        <UploadCloud size={24} />
        <p>
          {busy
            ? "Uploading your files…"
            : documents
              ? "Add supporting documentation"
              : "Help others see the challenge"}
        </p>
        <small className="muted">JPEG, PNG, WebP{documents ? ", PDF" : ""} · up to 5 MB each</small>
        <input
          type="file"
          aria-label={documents ? "Upload supporting documentation" : "Upload problem images"}
          accept={
            documents
              ? "image/jpeg,image/png,image/webp,application/pdf"
              : "image/jpeg,image/png,image/webp"
          }
          multiple
          disabled={busy}
          onChange={upload}
        />
      </div>
      {files.map((f) => (
        <div className="upload-file" key={f.id}>
          <FileCheck size={15} />
          {f.name}
          <button
            type="button"
            className="icon-btn"
            aria-label={`Remove ${f.name}`}
            onClick={() => onChange(files.filter((x) => x.id !== f.id))}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
