import { AppError, checkOrigin } from "./security";
import { limitedBody } from "./http";
import { Prisma } from "@prisma/client";
import { z } from "zod";
export async function nativeJson(req: Request) {
  // Browsers cannot issue this cross-origin request without a CORS preflight;
  // native clients have no ambient cookies or browser Origin header.
  if (req.headers.get("origin")) await checkOrigin(req);
  if (
    req.headers.get("x-civicbridge-client") !== "native" ||
    !req.headers.get("content-type")?.startsWith("application/json")
  )
    throw new AppError(415, "A native JSON request is required.");
  try {
    return JSON.parse(new TextDecoder().decode(await limitedBody(req, 12000)));
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(400, "Invalid JSON request.");
  }
}
export function mobileJson(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}
export function mobileError(error: unknown) {
  if (error instanceof AppError) return mobileJson({ error: error.message }, error.status);
  if (error instanceof z.ZodError)
    return mobileJson({ error: error.issues[0]?.message ?? "Check your entries." }, 400);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
    return mobileJson({ error: "This account already exists. Sign in instead." }, 409);
  return mobileJson({ error: "The request failed. Please try again." }, 500);
}
