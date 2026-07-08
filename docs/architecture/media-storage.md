# Media Storage — Architecture

**Version:** 1.0.0

## API

| Method | Path | Roles |
|--------|------|-------|
| `POST` | `/api/v1/platform/media/upload` | SUPER_ADMIN, FULFILLMENT |
| `GET` | `/api/v1/media/files/*` | Public read (local storage) |

## Module

```
apps/api/src/media/
├── media.module.ts
├── media.service.ts
├── platform-media.controller.ts
├── media-files.controller.ts
├── storage-provider.interface.ts
├── local-storage.provider.ts
└── s3-storage.provider.ts
```

## Storage providers

- `local` — writes to `MEDIA_LOCAL_PATH`; served via `GET /media/files/:key`
- `s3` — `@aws-sdk/client-s3` PutObject; public URL via `S3_PUBLIC_URL`

## Data model

- `MediaAsset` — platform upload record
- `MasterSkuImage` — joins MasterSku to MediaAsset
- `ProductImage` — tenant product display snapshot (url copy)

## Env

See `.env.example` — `MEDIA_STORAGE`, `MEDIA_LOCAL_PATH`, `MEDIA_MAX_BYTES`, `MEDIA_PUBLIC_BASE_URL`, `S3_*`.
