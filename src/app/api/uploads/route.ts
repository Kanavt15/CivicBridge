import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { AppError, checkOrigin, rateLimit } from "@/lib/security";
import { limitedBody } from "@/lib/http";
export async function POST(req: Request) {
  try {
    await checkOrigin(req);
    const user = await requireUser();
    await rateLimit(user.id, "upload", 12, 3600000);
    if (Number(req.headers.get("content-length") ?? 0) > 5300000)
      throw new AppError(413, "File must be smaller than 5 MB.");
    const bytes = await limitedBody(req, 5300000);
    const form = await new Request(req.url, {
      method: "POST",
      headers: { "Content-Type": req.headers.get("content-type") ?? "" },
      body: bytes,
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024)
      throw new AppError(400, "Choose a JPEG, PNG, WebP, or PDF smaller than 5 MB.");
    const data = Buffer.from(await file.arrayBuffer());
    const hex = data.subarray(0, 12).toString("hex");
    let mime = "";
    if (hex.startsWith("ffd8ff")) mime = "image/jpeg";
    else if (hex.startsWith("89504e470d0a1a0a")) mime = "image/png";
    else if (
      data.subarray(0, 4).toString() === "RIFF" &&
      data.subarray(8, 12).toString() === "WEBP"
    )
      mime = "image/webp";
    else if (data.subarray(0, 5).toString() === "%PDF-") mime = "application/pdf";
    if (!mime || mime !== file.type)
      throw new AppError(400, "The file contents do not match a supported file type.");
    const row = await db.problemImage.create({
      data: {
        name: file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 150),
        mime,
        data,
        ownerId: user.id,
        problemId: null,
        proposalId: null,
      },
      select: { id: true, name: true, mime: true },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof AppError ? e.message : "Upload failed. Try again." },
      { status: e instanceof AppError ? e.status : 500 },
    );
  }
}
