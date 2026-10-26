import { registerUser } from "@/lib/registration";
import { mobileJson, nativeJson, mobileError } from "@/lib/mobile-http";
export async function POST(req: Request) {
  try {
    return mobileJson(await registerUser(await nativeJson(req)), 201);
  } catch (e) {
    return mobileError(e);
  }
}
