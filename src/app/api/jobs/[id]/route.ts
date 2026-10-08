import { getJob } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  return job ? Response.json(job) : Response.json({ error: "Not found" }, { status: 404 });
}
