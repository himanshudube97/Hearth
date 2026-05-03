-- Allow entry_photos.url to be null. Photos stored as opaque blobs (via the
-- photo storage adapter) keep their reference in encryptedRef (E2EE) or
-- "/api/photos/{handle}" in url; legacy rows keep their data URL.
ALTER TABLE "entry_photos" ALTER COLUMN "url" DROP NOT NULL;
