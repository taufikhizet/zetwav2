import { z } from 'zod';

export const listChannelsQuerySchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'SUBSCRIBER']).optional(),
});

export const createChannelSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  picture: z.string().optional(), // In WAHA it accepts RemoteFile or BinaryFile, simplified here to string (url/base64) or handle file upload separately?
  // WAHA DTO says picture is RemoteFile | BinaryFile.
  // Zetwa usually handles file uploads via Multer or similar if it's binary.
  // For now let's stick to what createChannel in service expects (string path/url/base64).
});

export const previewChannelMessagesSchema = z.object({
  downloadMedia: z.enum(['true', 'false']).transform((v) => v === 'true').optional().default('false'),
  limit: z.number({ coerce: true }).min(1).optional().default(10),
});

export const channelSearchSchema = z.object({
  limit: z.number().optional().default(50),
  startCursor: z.string().optional().default(''),
});

export const channelSearchByViewSchema = channelSearchSchema.extend({
  view: z.string().default('RECOMMENDED'),
  countries: z.array(z.string()).min(1).default(['US']),
  categories: z.array(z.string()).default([]),
});

export const channelSearchByTextSchema = channelSearchSchema.extend({
  text: z.string().min(1),
  categories: z.array(z.string()).default([]),
});
