import { categoriesRepository, type Category, type NewCategory } from './categories.repository';
import { AppError } from '../../common/response';

export class CategoriesService {
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async listAll() {
    return categoriesRepository.findAllWithCount();
  }

  async getById(id: number): Promise<Category> {
    const category = await categoriesRepository.findById(id);
    if (!category) {
      throw AppError.notFound(`Category with ID '${id}' was not found`);
    }
    return category;
  }

  async create(data: { name: string; description?: string }): Promise<Category> {
    if (!data.name || data.name.trim() === '') {
      throw AppError.badRequest('Category name is required');
    }

    const slug = this.slugify(data.name);

    // Prevent duplicate slugs
    const existing = await categoriesRepository.findBySlug(slug);
    if (existing) {
      throw AppError.conflict(`Category '${data.name}' already exists`);
    }

    return categoriesRepository.create({
      name: data.name.trim(),
      slug,
      description: data.description,
    });
  }

  async update(id: number, data: { name?: string; description?: string }): Promise<Category> {
    const updates: Partial<NewCategory> = {};

    if (data.name !== undefined) {
      if (data.name.trim() === '') {
        throw AppError.badRequest('Category name cannot be empty');
      }
      updates.name = data.name.trim();
      updates.slug = this.slugify(data.name);

      const existing = await categoriesRepository.findBySlug(updates.slug);
      if (existing && existing.id !== id) {
        throw AppError.conflict(`Category '${data.name}' already exists`);
      }
    }

    if (data.description !== undefined) {
      updates.description = data.description;
    }

    const updated = await categoriesRepository.update(id, updates);
    if (!updated) {
      throw AppError.notFound(`Category with ID '${id}' was not found`);
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    const deleted = await categoriesRepository.delete(id);
    if (!deleted) {
      throw AppError.notFound(`Category with ID '${id}' was not found`);
    }
  }
}

export const categoriesService = new CategoriesService();