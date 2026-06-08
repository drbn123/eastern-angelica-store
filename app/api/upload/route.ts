import { randomUUID } from "crypto";
import { isAuthenticated } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  if (!["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return Response.json({ error: "Invalid file type" }, { status: 400 });
  }

  const folder = new URL(request.url).searchParams.get("folder") ?? "journal";
  const safeFolder = folder.replace(/[^a-z0-9-]/g, "");
  const filename = `${safeFolder}/${randomUUID()}.${ext}`;

  // Vercel Blob in production, local filesystem in dev
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(filename, file, { access: "public" });
    return Response.json({ url: blob.url });
  }

  // Local dev fallback
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");
  const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, `${randomUUID()}.${ext}`), Buffer.from(await file.arrayBuffer()));
  return Response.json({ url: `/uploads/${safeFolder}/${filename}` });
}
