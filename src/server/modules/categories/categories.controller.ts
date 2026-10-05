import type { Context } from 'hono';
import { categoriesService } from './categories.service';
import { responder, AppError } from '../../common/response';
function parseId(raw: string | undefined): number
{
    const id = Number(raw);
    if(!Number.isInteger(id) || id < 0)
        throw AppError.badRequest(`'${raw}' is not a valid Category Id`)

    return id;
}

export class CategoriesController {
  async list(c: Context) {
    const categories = await categoriesService.listAll();
    return responder.success(c, categories, 200, { total: categories.length });
  }

  async getOne(c: Context) {
    const id = parseId(c.req.param('id'));
    const category = await categoriesService.getById(id);
    return responder.success(c, category);
  }

  async create(c: Context) {
    const body = await c.req.json();
    const category = await categoriesService.create({
      name: body.name,
      description: body.description,
    });
    return responder.created(c, category);
  }

  async update(c: Context) {
    const id = parseId(c.req.param('id'));
    const body = await c.req.json();
    const category = await categoriesService.update(id, {
      name: body.name,
      description: body.description,
    });
    return responder.success(c, category);
  }

  async delete(c: Context) {
    const id = parseId(c.req.param('id'));
    await categoriesService.delete(id);
    return responder.noContent(c);
  }
}

export const categoriesController = new CategoriesController();