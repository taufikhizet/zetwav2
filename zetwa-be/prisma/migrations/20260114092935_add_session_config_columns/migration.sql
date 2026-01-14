-- AlterTable: Add new dedicated config columns
ALTER TABLE "wa_sessions" ADD COLUMN     "browserName" TEXT,
ADD COLUMN     "debug" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deviceName" TEXT,
ADD COLUMN     "ignoreBroadcast" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ignoreChannels" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ignoreGroups" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ignoreStatus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nowebFullSync" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nowebMarkOnline" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nowebStoreEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "proxyPassword" TEXT,
ADD COLUMN     "proxyServer" TEXT,
ADD COLUMN     "proxyUsername" TEXT;

-- Data migration: Move config from nested metadata.config to dedicated columns
UPDATE "wa_sessions"
SET 
  "debug" = COALESCE((metadata->'config'->>'debug')::boolean, false),
  "deviceName" = metadata->'config'->'client'->>'deviceName',
  "browserName" = metadata->'config'->'client'->>'browserName',
  "proxyServer" = metadata->'config'->'proxy'->>'server',
  "proxyUsername" = metadata->'config'->'proxy'->>'username',
  "proxyPassword" = metadata->'config'->'proxy'->>'password',
  "ignoreStatus" = COALESCE((metadata->'config'->'ignore'->>'status')::boolean, false),
  "ignoreGroups" = COALESCE((metadata->'config'->'ignore'->>'groups')::boolean, false),
  "ignoreChannels" = COALESCE((metadata->'config'->'ignore'->>'channels')::boolean, false),
  "ignoreBroadcast" = COALESCE((metadata->'config'->'ignore'->>'broadcast')::boolean, false),
  "nowebStoreEnabled" = COALESCE((metadata->'config'->'noweb'->'store'->>'enabled')::boolean, true),
  "nowebFullSync" = COALESCE((metadata->'config'->'noweb'->'store'->>'fullSync')::boolean, false),
  "nowebMarkOnline" = COALESCE((metadata->'config'->'noweb'->>'markOnline')::boolean, true)
WHERE metadata IS NOT NULL AND metadata->'config' IS NOT NULL;

-- Extract user metadata from metadata.config.metadata and move it to top-level metadata
UPDATE "wa_sessions"
SET metadata = metadata->'config'->'metadata'
WHERE metadata IS NOT NULL 
  AND metadata->'config'->'metadata' IS NOT NULL 
  AND jsonb_typeof(metadata->'config'->'metadata') = 'object';

-- Clear metadata for sessions where metadata only contained config (no user metadata)
UPDATE "wa_sessions"
SET metadata = NULL
WHERE metadata IS NOT NULL 
  AND (metadata->'config'->'metadata' IS NULL OR jsonb_typeof(metadata->'config'->'metadata') != 'object');
