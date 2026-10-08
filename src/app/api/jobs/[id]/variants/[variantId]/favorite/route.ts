import { z } from "zod";
import { getJob, saveJob } from "@/lib/store";

const Body = z.object({ favorite: z.boolean() });

// Marks a variant as a favourite. Works in any status, so a designer can
// shortlist ideas before they are fixed and approved.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { id, variantId } = await params;
  const job = await getJob(id);
  const variant = job?.variants.find((v) => v.id === variantId);
  if (!job || !variant) return Response.json({ error: "Not found" }, { status: 404 });

  variant.favorite = parsed.data.favorite;
  await saveJob(job);
  return Response.json(variant);
}
