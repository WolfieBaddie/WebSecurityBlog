import { Hono } from 'hono';
import { categoriesController } from './categories.controller';
import { requireAuth, requireAdmin } from '../../middleware/auth';

const categoriesRouter = new Hono();

// Public reads (blog filters, category pages)
categoriesRouter.get('/', (c) => categoriesController.list(c));
categoriesRouter.get('/:id', (c) => categoriesController.getOne(c));

// Admin-only mutations (taxonomy is global — too destructive for authors)
categoriesRouter.post('/', requireAuth, requireAdmin(), (c) => categoriesController.create(c));
categoriesRouter.put('/:id', requireAuth, requireAdmin(), (c) => categoriesController.update(c));
categoriesRouter.delete('/:id', requireAuth, requireAdmin(), (c) => categoriesController.delete(c));

export default categoriesRouter;
