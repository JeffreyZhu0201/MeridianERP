# Media Storage — Architecture

**Version:** 1.0.1

## API

| Method | Path | Roles |
|--------|------|-------|
| `POST` | `/api/v1/platform/media/upload` | SUPER_ADMIN, FULFILLMENT |
| `GET` | `/api/v1/media/files/*` | Public read (local storage only) |

## Module

```
apps/api/src/media/
├── media.module.ts
├── media.service.ts
├── platform-media.controller.ts   # upload + local file serving (MediaFilesController)
├── media-validation.ts
├── storage-provider.interface.ts
├── local-storage.provider.ts
└── s3-storage.provider.ts
```

`PlatformMediaController` handles authenticated uploads. `MediaFilesController` (same file) serves local blobs when `MEDIA_STORAGE=local`. In S3 mode, files are read via `S3_PUBLIC_URL` (no API file route).

## Storage providers

- `local` — writes to `MEDIA_LOCAL_PATH`; served via `GET /media/files/*`
- `s3` — `@aws-sdk/client-s3` PutObject; public URL via `S3_PUBLIC_URL` (bucket must allow browser GET/CORS for store/admin)

## Security

- Upload: MIME allowlist + magic-byte validation; max size `MEDIA_MAX_BYTES`
- Local serve: resolved path must stay under `MEDIA_LOCAL_PATH` (path traversal rejected)

## Lifecycle

- `replaceMasterSkuImages` removes `MasterSkuImage` rows; `MediaService.cleanupUnreferencedMediaAssets` deletes blobs only when no `MasterSkuImage` or `ProductImage.sourceMediaAssetId` references remain

## Data model

- `MediaAsset` — platform upload record
- `MasterSkuImage` — joins MasterSku to MediaAsset
- `ProductImage` — tenant product display snapshot (url copy)

## Env

See `.env.example` — `MEDIA_STORAGE`, `MEDIA_LOCAL_PATH`, `MEDIA_MAX_BYTES`, `MEDIA_PUBLIC_BASE_URL`, `S3_*`.

When `MEDIA_STORAGE=s3`, set `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_PUBLIC_URL`.
