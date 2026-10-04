import { Hono } from 'hono';
import { db } from '../db/client';
import { posts, postBlocks } from '../db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { responder, AppError } from '../common/response';
import type { InferSelectModel } from 'drizzle-orm';
const postsRouter = new Hono();
type PostBlock = InferSelectModel<typeof postBlocks>;
// ==========================================
// 1. PUBLIC: List Published Posts
// ==========================================
postsRouter.get('/', async (c) => {
  const publishedPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.status, 'published'));

  return responder.success(c, publishedPosts, 200, {
    total: publishedPosts.length,
  });
});

// ==========================================
// ADMIN: List ALL Posts (Drafts, Published, Archived)
// ==========================================
postsRouter.get('/admin', async (c) => {
  const statusParam = c.req.query('status');

  const query = db.select().from(posts);
  
  const allPosts = statusParam
    ? await query.where(eq(posts.status, statusParam))
    : await query;

  return responder.success(c, allPosts, 200, {
    total: allPosts.length,
  });
});

postsRouter.get('/admin', async (c) => {
  try {
    const statusParam = c.req.query('status');
    const query = db.select().from(posts);

    const allPosts = statusParam
      ? await query.where(eq(posts.status, statusParam))
      : await query;

    return responder.success(c, allPosts, 200, {
      total: allPosts.length,
    });
  } catch (err: any) {
    return responder.error(c, err.message, 500);
  }
});

// ==========================================
// 2. ADMIN: Fetch Editable Post by UUID
// ==========================================
postsRouter.get('/admin/:id', async (c) => {
  const id = c.req.param('id');

  if(!id || id === undefined || id === 'new')
    throw AppError.badRequest("Invalid post ID provided")

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, id),
  });

  if (!post) {
    throw AppError.notFound(`Post with ID '${id}' was not found`);
  }

  const blocks = await db
    .select()
    .from(postBlocks)
    .where(eq(postBlocks.postId, post.id))
    .orderBy(asc(postBlocks.orderIndex));

  return responder.success(c, { ...post, blocks });
});

// ==========================================
// 3. CREATE: New Post + Blocks
// ==========================================
postsRouter.post('/', async (c) => {
  const body = await c.req.json();
  const {
    authorId,
    categoryId,
    slug,
    title,
    summary,
    contentType = 'article',
    status = 'draft',
    blocks = [],
  } = body;

  if (!authorId || !slug || !title) {
    throw AppError.badRequest('authorId, slug, and title are required fields');
  }

  const result = await db.transaction(async (tx) => {
    const [newPost] = await tx
      .insert(posts)
      .values({
        authorId,
        categoryId,
        slug,
        title,
        summary,
        contentType,
        status,
        publishedAt: status === 'published' ? new Date() : null,
      })
      .returning();

    let insertedBlocks: any[] = [];
    if (blocks.length > 0) {
      const blocksToInsert = blocks.map((b: any, index: number) => ({
        postId: newPost.id,
        orderIndex: b.orderIndex ?? index,
        blockType: b.blockType,
        assetId: b.assetId || null,
        payload: b.payload || {},
      }));

      insertedBlocks = await tx.insert(postBlocks).values(blocksToInsert).returning();
    }

    return { ...newPost, blocks: insertedBlocks };
  });

  return responder.created(c, result);
});

// ==========================================
// 4. UPDATE: Modify Post and Blocks
// ==========================================
postsRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { categoryId, slug, title, summary, contentType, status, blocks } = body;

  const result = await db.transaction(async (tx) => {
    const [updatedPost] = await tx
      .update(posts)
      .set({
        ...(categoryId !== undefined && { categoryId }),
        ...(slug && { slug }),
        ...(title && { title }),
        ...(summary !== undefined && { summary }),
        ...(contentType && { contentType }),
        ...(status && {
          status,
          publishedAt: status === 'published' ? new Date() : undefined,
        }),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    if (!updatedPost) {
      throw AppError.notFound(`Post with ID '${id}' was not found`);
    }

    // Explicitly typed array prevents ts(7034)
    let currentBlocks: (typeof postBlocks.$inferSelect)[] = [];

    if (Array.isArray(blocks)) {
      await tx.delete(postBlocks).where(eq(postBlocks.postId, id));

      if (blocks.length > 0) {
        const blocksToInsert = blocks.map((b: any, idx: number) => ({
          postId: id,
          orderIndex: b.orderIndex ?? idx,
          blockType: b.blockType,
          assetId: b.assetId || null,
          payload: b.payload || {},
        }));

        currentBlocks = await tx.insert(postBlocks).values(blocksToInsert).returning();
      }
    } else {
      currentBlocks = await tx
        .select()
        .from(postBlocks)
        .where(eq(postBlocks.postId, id))
        .orderBy(asc(postBlocks.orderIndex));
    }

    return { ...updatedPost, blocks: currentBlocks };
  });

  return responder.success(c, result);
});

// ==========================================
// 5. SOFT DELETE / ARCHIVE
// ==========================================
postsRouter.patch('/:id/archive', async (c) => {
  const id = c.req.param('id');

  const [archived] = await db
    .update(posts)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(posts.id, id))
    .returning();

  if (!archived) {
    throw AppError.notFound(`Post with ID '${id}' was not found`);
  }

  return responder.success(c, archived);
});

// ==========================================
// 6. HARD DELETE
// ==========================================
postsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const [deleted] = await db
    .delete(posts)
    .where(eq(posts.id, id))
    .returning();

  if (!deleted) {
    throw AppError.notFound(`Post with ID '${id}' was not found`);
  }

  return responder.noContent(c);
});

export default postsRouter;