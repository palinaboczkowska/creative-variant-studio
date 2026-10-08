import { getImage } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dataUrl = await getImage(id);
  if (!dataUrl) return new Response("Not found", { status: 404 });

  const [meta, base64] = dataUrl.split(",");
  const type = meta.slice("data:".length, meta.indexOf(";"));
  return new Response(Buffer.from(base64, "base64"), {
    headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
