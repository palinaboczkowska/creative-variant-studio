import { randomUUID } from "node:crypto";
import { z } from "zod";
import { saveImage } from "@/lib/store";

// The browser resizes images before upload, so anything bigger than this
// was not made by the app.
const MAX_DATA_URL_LENGTH = 900_000;

const Body = z.object({
  dataUrl: z
    .string()
    .max(MAX_DATA_URL_LENGTH)
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Upload a JPEG, PNG or WebP image under about 650 KB" }, { status: 400 });
  }
  const id = randomUUID();
  await saveImage(id, parsed.data.dataUrl);
  return Response.json({ id }, { status: 201 });
}
