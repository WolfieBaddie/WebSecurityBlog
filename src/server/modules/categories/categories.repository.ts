import { db } from '../../db/client';
import { categories, posts } from '../../db/schema';
import { eq, count } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export class CategoriesRepository {
  async findAll(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.name);
  }

  // Find all categories with their attached post count
  async findAllWithCount() {
    return db
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        description: categories.description,
        postCount: count(posts.id),
      })
      .from(categories)
      .leftJoin(posts, eq(categories.id, posts.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.name);
  }

  async findById(id: number): Promise<Category | null> {
    const result = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });
    return result || null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const result = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
    return result || null;
  }

  async create(data: NewCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(data).returning();
    return created;
  }

  async update(id: number, data: Partial<NewCategory>): Promise<Category | null> {
    const [updated] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: number): Promise<Category | null> {
    const [deleted] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    return deleted || null;
  }
}

export const categoriesRepository = new CategoriesRepository();