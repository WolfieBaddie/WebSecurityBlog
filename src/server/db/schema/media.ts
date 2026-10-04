import { pgSchema, uuid, varchar, text, bigint, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './core';

export const mediaSchema = pgSchema('media');

export const assets = mediaSchema.table('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  uploaderId: uuid('uploader_id').notNull().references(() => users.id),
  driveFileId: varchar('drive_file_id', { length: 100 }).notNull().unique(),
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
  webContentLink: text('web_content_link'),
  webViewLink: text('web_view_link'),
  thumbnailLink: text('thumbnail_link'),
  width: integer('width'),
  height: integer('height'),
  altText: text('alt_text'),
  caption: text('caption'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});