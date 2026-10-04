import {Hono} from 'hono';
import {mediaController} from './media.controller';

const mediaRouter = new Hono();

mediaRouter.post('/upload', (c) => mediaController.upload(c));
mediaRouter.get('/', (c) => mediaController.list(c));

export default mediaRouter;


