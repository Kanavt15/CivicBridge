import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { AppError } from "./security";
export const noStore = { "Cache-Control": "no-store" };
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: noStore });
}
export function failure(error: unknown) {
  if (error instanceof AppError) return json({ error: error.message }, error.status);
  if (error instanceof z.ZodError)
    return json(
      { error: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") },
      400,
    );
  const requestId = randomUUID();
  const code = (error as { code?: string })?.code;
  console.error("Request failed", {
    requestId,
    code: typeof code === "string" && /^P\d{4}$/.test(code) ? code : "INTERNAL",
  });
  return json({ error: "The request could not be completed. Please try again.", requestId }, 500);
}
export async function limitedBody(req: Request, maxBytes: number) {
  if (Number(req.headers.get("content-length") ?? 0) > maxBytes)
    throw new AppError(413, "Request is too large.");
  const reader = req.body?.getReader();
  if (!reader) throw new AppError(400, "Request body is required.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new AppError(413, "Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer;
}
export async function parseJson<T>(req: Request, schema: z.ZodType<T>) {
  const bytes = await limitedBody(req, 32000);
  let data;
  try {
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new AppError(400, "Invalid JSON request.");
  }
  return schema.parse(data);
}
