/**
 * Vercel Serverless Function — /api/blob-upload
 *
 * Authorises direct browser-to-storage uploads of photos/videos to Vercel
 * Blob. The browser (via @vercel/blob/client `upload`) hits this route only to
 * mint a short-lived upload token — the file bytes go straight to Blob storage,
 * bypassing the ~4.5MB serverless body limit so large videos work.
 *
 * Auth: the client passes the shared secret in `clientPayload`; it must match
 * BLOG_POST_SECRET.
 *
 * Required env var: BLOB_READ_WRITE_TOKEN — added automatically when you create
 * a Blob store in the Vercel dashboard (Storage → Create → Blob).
 */

const { handleUpload } = require("@vercel/blob/client");

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB per file

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const jsonResponse = await handleUpload({
      request: req,
      body: typeof req.body === "string" ? JSON.parse(req.body) : req.body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload = {};
        try { payload = JSON.parse(clientPayload || "{}"); } catch (_) {}
        if (!process.env.BLOG_POST_SECRET || payload.secret !== process.env.BLOG_POST_SECRET) {
          throw new Error("Unauthorized");
        }
        return {
          allowedContentTypes: ["image/*", "video/*"],
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_BYTES,
        };
      },
      // Fires server-side once the upload finishes (production only). Nothing to
      // persist here — the client already has the URL to include in the post.
      onUploadCompleted: async () => {},
    });
    return res.status(200).json(jsonResponse);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: String(err.message || err) });
  }
};
