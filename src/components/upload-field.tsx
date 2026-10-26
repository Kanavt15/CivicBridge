"use client";
import { Input, Control } from "@/components/localized-fields";
import { Text } from "@/components/i18n";
import { useI18n } from "@/components/i18n";

import { UploadCloud, FileCheck, X, Camera } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
export function UploadField({
  files,
  onChange,
  documents = false,
  onBusyChange,
}: {
  files: { id: string; name: string }[];
  onChange: (files: { id: string; name: string }[]) => void;
  documents?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    if (files.length + selected.length > (documents ? 3 : 4)) {
      toast.error(t("Attach at most {count} files.", { count: documents ? 3 : 4 }));
      input.value = "";
      return;
    }
    setBusy(true);
    onBusyChange?.(true);
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
      toast.error(t((e as Error).message));
    } finally {
      setBusy(false);
      onBusyChange?.(false);
      input.value = "";
    }
  }
  return (
    <div>
      <div className="upload-zone">
        <UploadCloud size={24} />
        <p>
          <Text>
            {busy
              ? "Uploading your files…"
              : documents
                ? "Add supporting documentation"
                : "Help others see the challenge"}
          </Text>
        </p>
        <small className="muted">
          <Text>{"JPEG, PNG, WebP"}</Text>
          <Text>{documents ? ", PDF" : ""}</Text> <Text>{" · up to 5 MB each"}</Text>
        </small>
        <Input
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
      {!documents && (
        <label className="camera-upload">
          <Camera size={18} />
          <Text>{busy ? "Uploading photo…" : "Take a photo"}</Text>
          <Input
            type="file"
            aria-label="Take a photo of the problem"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            disabled={busy || files.length >= 4}
            onChange={upload}
          />
          <small>
            <Text>{"Or use the upload area to choose from your gallery."}</Text>
          </small>
        </label>
      )}
      {files.map((f) => (
        <div className="upload-file" key={f.id}>
          <FileCheck size={15} />
          {f.name}
          <Control
            type="button"
            className="icon-btn"
            aria-label={`Remove ${f.name}`}
            onClick={() => onChange(files.filter((x) => x.id !== f.id))}
          >
            <X size={14} />
          </Control>
        </div>
      ))}
    </div>
  );
}
