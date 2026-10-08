import { z } from "zod";
import { LANGUAGES } from "@/lib/formats";
import { createJob } from "@/lib/jobs";
import { listJobs, saveJob } from "@/lib/store";
import { parseProducts } from "@/lib/validate";

const Body = z.object({
  productsCsv: z.string().min(1),
  languages: z.array(z.enum(LANGUAGES)).min(1).max(5),
  tone: z.string().max(200).default("friendly and clear"),
  bannedWords: z.array(z.string().max(40)).max(30).default([]),
});

const MAX_PRODUCTS = 5;

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const products = parseProducts(parsed.data.productsCsv);
  if (products.length === 0) return Response.json({ error: "No products found" }, { status: 400 });
  if (products.length > MAX_PRODUCTS) {
    return Response.json({ error: `Max ${MAX_PRODUCTS} products per job` }, { status: 400 });
  }

  try {
    const job = await createJob(products, parsed.data.languages, {
      tone: parsed.data.tone,
      bannedWords: parsed.data.bannedWords,
    });
    await saveJob(job);
    return Response.json(job, { status: 201 });
  } catch (err) {
    console.error("createJob failed", err);
    return Response.json({ error: "Could not generate copy, try again" }, { status: 502 });
  }
}

export async function GET() {
  return Response.json(await listJobs());
}
