import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";

/**
 * POST /api/uploads
 *
 * Multipart form-data: `file` field with an image.
 * Auth required.
 *
 * Saves the image to /public/uploads/<random>.webp (re-encoded to
 * WebP for size, max dimension 1200px), returns the public URL.
 *
 * Why local storage instead of S3:
 *   - Zero infra to set up — works in dev and on a VPS.
 *   - On Vercel serverless, `public/` is read-only at runtime, so
 *     for prod you'd swap this for S3-compatible storage. The route's
 *     shape stays the same; only the writeFile call changes.
 *
 * Security:
 *   - Magic-byte sniff — we use sharp to decode; if it's not a real
 *     image, sharp throws and we return 400. We never trust the
 *     declared Content-Type.
 *   - Max 5MB raw upload.
 *   - Output is re-encoded to WebP — strips any embedded payload
 *     (EXIF, comments, etc.).
 *   - CSP on /uploads/* sets `script-src 'none'` so even a polyglot
 *     upload can't execute as a script in the browser.
 */
export async function POST(req: NextRequest) {
  // Rate limit: 30 uploads per minute per IP (auth-required route,
  // part of normal onboarding/product editing flow).
  const blocked = enforceRateLimit(req, "upload", { limit: 30, windowMs: 60_000 });
  if (blocked) return blocked;

  try {
    const user = await requireUser();

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 5 MB max.
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Re-encode to WebP, max 1200px wide, quality 82. sharp will
    // throw if the input isn't a real image — that's our magic-byte
    // check. We catch it and return a clean 400.
    let webp: Buffer;
    try {
      webp = await sharp(bytes)
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch (err: any) {
      console.error("[uploads] sharp rejected:", err?.message ?? err);
      return NextResponse.json(
        { error: "File is not a valid image" },
        { status: 400 },
      );
    }

    // Random filename — never trust the user-supplied name. Random
    // 16 bytes → 32 hex chars + extension.
    const id = randomBytes(16).toString("hex");
    const filename = `${id}.webp`;

    // Resolve the absolute path. process.cwd() is the project root
    // in dev and in the standalone build.
    const uploadsDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, webp);

    // Public URL is just `/uploads/<filename>` — the next.config.ts
    // headers() rule sets immutable caching on this path.
    const url = `/uploads/${filename}`;

    console.log(
      `[uploads] user=${user.id} saved ${url} ` +
        `(${file.size}B raw → ${webp.length}B webp)`,
    );

    return NextResponse.json({
      url,
      size: webp.length,
      contentType: "image/webp",
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[uploads POST] error", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload" },
      { status: 500 },
    );
  }
}
