import { pgSchema, uuid, varchar, text, serial, integer, boolean, bigint, timestamp } from 'drizzle-orm/pg-core';
import { users } from './core';

export const challengesSchema = pgSchema('challenges');

export const challengeCategories = challengesSchema.table('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
});

export const challenges = challengesSchema.table('challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  categoryId: integer('category_id').references(() => challengeCategories.id),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  points: integer('points').notNull().default(100),
  description: text('description').notNull(),
  artifactUrl: text('artifact_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const submissions = challengesSchema.table('submissions', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  submittedFlag: text('submitted_flag').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
});