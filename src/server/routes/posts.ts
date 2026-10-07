import { Hono } from 'hono';
import { db } from '../db/client';
import { posts, postBlocks } from '../db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { responder, AppError } from '../common/response';
import { requireAuth, requireAuthorOrAdmin, requireAdmin } from '../middleware/auth';
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

  // Edge-friendly: Cloudflare CDN caches the list for 60s, serves stale while revalidating
  c.header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  return responder.success(c, publishedPosts, 200, {
    total: publishedPosts.length,
  });
});

// ==========================================
// 2. ADMIN (auth): List ALL Posts (Drafts, Published, Archived)
// ==========================================
postsRouter.get('/admin', requireAuth, async (c) => {
  const statusParam = c.req.query('status');

  const allPosts = statusParam
    ? await db.select().from(posts).where(eq(posts.status, statusParam))
    : await db.select().from(posts);

  return responder.success(c, allPosts, 200, {
    total: allPosts.length,
  });
});

// ==========================================
// 3. ADMIN (auth): Fetch Editable Post by UUID
// ==========================================
postsRouter.get('/admin/:id', requireAuth, async (c) => {
  const id = c.req.param('id');

  if (!id || id === 'undefined' || id === 'new') {
    throw AppError.badRequest('Invalid post ID provided');
  }

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
// 4. CREATE (author/admin): New Post + Blocks
// ==========================================
postsRouter.post('/', requireAuthorOrAdmin(), async (c) => {
  const body = await c.req.json();
  const {
    categoryId,
    slug,
    title,
    summary,
    contentType = 'article',
    status = 'draft',
    blocks = [],
  } = body;

  // The authenticated operator is the author — never trust client-supplied authorId
  const authorId = c.get('user').sub;

  if (!slug || !title) {
    throw AppError.badRequest('slug and title are required fields');
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
// 5. UPDATE (author/admin): Modify Post and Blocks
// ==========================================
postsRouter.put('/:id', requireAuthorOrAdmin(), async (c) => {
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
// 6. SOFT DELETE / ARCHIVE (author/admin)
// ==========================================
postsRouter.patch('/:id/archive', requireAuthorOrAdmin(), async (c) => {
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
// 7. HARD DELETE (admin only)
// ==========================================
postsRouter.delete('/:id', requireAdmin(), async (c) => {
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
