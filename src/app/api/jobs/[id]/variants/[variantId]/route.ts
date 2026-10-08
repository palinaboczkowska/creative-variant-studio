import { z } from "zod";
import { FORMATS } from "@/lib/formats";
import { getJob, saveJob } from "@/lib/store";
import { checkCopy } from "@/lib/validate";

type Params = { params: Promise<{ id: string; variantId: string }> };

async function findVariant({ params }: Params) {
  const { id, variantId } = await params;
  const job = await getJob(id);
  const variant = job?.variants.find((v) => v.id === variantId);
  return { job, variant };
}

// A human approves each variant. Flagged variants cannot be approved
// until their copy passes every check.
export async function POST(_request: Request, ctx: Params) {
  const { job, variant } = await findVariant(ctx);
  if (!job || !variant) return Response.json({ error: "Not found" }, { status: 404 });
  if (variant.status === "flagged") {
    return Response.json({ error: "Flagged variants cannot be approved" }, { status: 409 });
  }

  variant.status = "approved";
  await saveJob(job);
  return Response.json(variant);
}

const Edit = z.object({ headline: z.string().max(200), cta: z.string().max(100) });

// A designer edits the copy. The same checks run again, and an edited
// variant always goes back to review.
export async function PATCH(request: Request, ctx: Params) {
  const parsed = Edit.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid copy" }, { status: 400 });

  const { job, variant } = await findVariant(ctx);
  if (!job || !variant) return Response.json({ error: "Not found" }, { status: 404 });

  const format = FORMATS.find((f) => f.id === variant.format)!;
  variant.copy = parsed.data;
  variant.checks = checkCopy(variant.copy, format, variant.product, job.rules);
  variant.status = variant.checks.every((c) => c.ok) ? "needs-review" : "flagged";
  await saveJob(job);
  return Response.json(variant);
}
