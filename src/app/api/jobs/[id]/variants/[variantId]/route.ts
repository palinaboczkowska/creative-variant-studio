import { z } from "zod";
import { FORMAT_IDS, MAX_SIZE, MIN_SIZE, resolveFormat } from "@/lib/formats";
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

const Edit = z.object({
  headline: z.string().max(200),
  cta: z.string().max(100),
  format: z.enum(FORMAT_IDS).optional(),
  size: z
    .object({
      width: z.number().int().min(MIN_SIZE).max(MAX_SIZE),
      height: z.number().int().min(MIN_SIZE).max(MAX_SIZE),
    })
    .optional(),
  style: z
    .object({
      radius: z.number().min(0).max(40),
      ctaShape: z.enum(["square", "rounded", "pill"]),
      textScale: z.number().min(0.7).max(1.6),
      align: z.enum(["left", "center"]),
    })
    .partial()
    .optional(),
});

// A designer edits the copy, format or shape. The checks run again against
// the new format's limits, and an edited variant always goes back to review.
export async function PATCH(request: Request, ctx: Params) {
  const parsed = Edit.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid copy" }, { status: 400 });

  const { job, variant } = await findVariant(ctx);
  if (!job || !variant) return Response.json({ error: "Not found" }, { status: 404 });

  const { headline, cta, format: formatId, size, style } = parsed.data;
  if (formatId) variant.format = formatId;
  if (variant.format === "custom") {
    if (size) variant.size = size;
    if (!variant.size) return Response.json({ error: "Custom format needs a size" }, { status: 400 });
  } else {
    delete variant.size;
  }
  if (style) variant.style = style;
  const format = resolveFormat(variant.format, variant.size);
  variant.copy = { headline, cta };
  variant.checks = checkCopy(variant.copy, format, variant.product, job.rules);
  variant.status = variant.checks.every((c) => c.ok) ? "needs-review" : "flagged";
  await saveJob(job);
  return Response.json(variant);
}
