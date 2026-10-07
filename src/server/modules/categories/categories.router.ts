import { Hono } from 'hono';
import { categoriesController } from './categories.controller';
import { requireAuth, requireAdmin } from '../../middleware/auth';

const categoriesRouter = new Hono();

// Public reads (blog filters, category pages) — edge-cached for 5 min
categoriesRouter.get('/', (c) => {
  c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  return categoriesController.list(c);
});
categoriesRouter.get('/:id', (c) => {
  c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  return categoriesController.getOne(c);
});

// Admin-only mutations (taxonomy is global — too destructive for authors)
categoriesRouter.post('/', requireAuth, requireAdmin(), (c) => categoriesController.create(c));
categoriesRouter.put('/:id', requireAuth, requireAdmin(), (c) => categoriesController.update(c));
categoriesRouter.delete('/:id', requireAuth, requireAdmin(), (c) => categoriesController.delete(c));

export default categoriesRouter;
