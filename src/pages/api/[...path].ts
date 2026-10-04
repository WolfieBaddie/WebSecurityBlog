export const prerender = false;

import type { APIRoute } from 'astro';
import app from '../../server/app';

export const ALL: APIRoute = (context) => {
  return app.fetch(context.request);
};