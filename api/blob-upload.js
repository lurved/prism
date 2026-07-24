/**
 * Vercel Serverless Function — /api/blob-upload
 *
 * Authorises direct browser-to-storage uploads of photos/videos to Vercel
 * Blob. The browser (via @vercel/blob/client `uploadPresigned`) hits this route
 * only to obtain a short-lived presigned URL — the file bytes go straight to
 * Blob storage, bypassing the ~4.5MB serverless body limit so large phone
 * videos work.
 *
 * Auth (ours): the client passes the shared secret in `clientPayload`; it must
 * match BLOG_POST_SECRET.
 *
 * Auth (Blob): `issueSignedToken` resolves credentials automatically — it works
 * with OIDC (VERCEL_OIDC_TOKEN + BLOB_STORE_ID, what the current Vercel Blob
 * integration provisions) *or* with a classic BLOB_READ_WRITE_TOKEN. We use the
 * presigned flow rather than `handleUpload` because `handleUpload` mints client
 * tokens by signing with BLOB_READ_WRITE_TOKEN specifically, which OIDC-based
 * stores don't have.
 *
 * Env: BLOB_STORE_ID + BLOB_WEBHOOK_PUBLIC_KEY (set by the Blob integration),
 * or BLOB_READ_WRITE_TOKEN.
 */

const { handleUploadPresigned } = require("@vercel/blob/client");
const { issueSignedToken } = require("@vercel/blob");

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB per file
const ALLOWED_CONTENT_TYPES = ["image/*", "video/*"];
const UPLOAD_WINDOW_MS = 10 * 60 * 1000; // presigned URL lifetime

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const jsonResponse = await handleUploadPresigned({
      body,
      request: req,
      getSignedToken: async (pathname, clientPayload) => {
        let payload = {};
        try { payload = JSON.parse(clientPayload || "{}"); } catch (_) {}
        if (!process.env.BLOG_POST_SECRET || payload.secret !== process.env.BLOG_POST_SECRET) {
          throw new Error("Unauthorized");
        }

        const validUntil = Date.now() + UPLOAD_WINDOW_MS;
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          validUntil,
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
        });

        return {
          token,
          urlOptions: {
            validUntil,
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            maximumSizeInBytes: MAX_BYTES,
            addRandomSuffix: true, // avoid collisions between same-named photos
          },
        };
      },
      // No onUploadCompleted: the client already has the URL it needs, and
      // skipping it avoids depending on a webhook round-trip.
    });

    return res.status(200).json(jsonResponse);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: String(err.message || err) });
  }
};
