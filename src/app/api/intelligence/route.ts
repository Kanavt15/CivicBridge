import { z } from "zod";
import artifact from "@/lib/ai/generated/model.json";
import demoArtifact from "@/lib/ai/generated/demo-model.json";
import { predict, type CivicModel } from "@/lib/ai/naive-bayes";
import { suggest } from "@/lib/domain";
import { requireUser } from "@/lib/session";
import { checkOrigin, rateLimit } from "@/lib/security";
import { json, failure, parseJson } from "@/lib/http";
export function GET(req: Request) {
  const selected = new URL(req.url).searchParams.get("dataset");
  return json((selected === "demo" ? demoArtifact : artifact).card);
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await requireUser();
    await rateLimit(user.id, "classifier", 30);
    const { text, dataset } = await parseJson(
      req,
      z.object({
        text: z.string().trim().min(20).max(6000),
        dataset: z.enum(["public", "demo"]).default("public"),
      }),
    );
    const selected = dataset === "demo" ? demoArtifact : artifact;
    return json({
      model: predict(selected.model as CivicModel, text),
      rules: suggest(text),
      provenance: selected.card.provenance,
      notice:
        "Local inference; text was not sent to an external provider. Model scores are uncalibrated and all suggestions require human review.",
    });
  } catch (error) {
    return failure(error);
  }
}
