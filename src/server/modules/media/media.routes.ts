import { Hono } from 'hono';
import { mediaController } from './media.controller';
import { requireAuth, requireAuthorOrAdmin } from '../../middleware/auth';

const mediaRouter = new Hono();

// Uploads: authors and admins only
mediaRouter.post('/upload', requireAuth, requireAuthorOrAdmin(), (c) => mediaController.upload(c));

// Media library listing: any authenticated operator
mediaRouter.get('/', requireAuth, (c) => mediaController.list(c));

export default mediaRouter;
