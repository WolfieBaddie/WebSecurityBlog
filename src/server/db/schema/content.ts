import { pgSchema, uuid, varchar, text, serial, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './core';
import { assets } from './media';

export const contentSchema = pgSchema('content');

export const categories = contentSchema.table('categories', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 60 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
});

export const posts = contentSchema.table('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorId: uuid('author_id').notNull().references(() => users.id),
  categoryId: integer('category_id').references(() => categories.id),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  summary: text('summary'),
  contentType: varchar('content_type', { length: 30 }).notNull().default('article'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const postBlocks = contentSchema.table('post_blocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  blockType: varchar('block_type', { length: 50 }).notNull(),
  assetId: uuid('asset_id').references(() => assets.id),
  payload: jsonb('payload').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});