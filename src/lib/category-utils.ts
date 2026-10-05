import { type ApiResponse, type ApiErrorResponse, AppError } from "@/server/common/response";


export interface Category
{
    id: number;
    slug: string;
    name: string;
    description: string | null;
    postCount?: number
}

export interface CategoryInput
{
    name: string;
    description?: string
}

function unwrapError(json: ApiErrorResponse): never{
    throw new Error(json.error?.message || 'Request failed')
}

export async function getAllCategories() : Promise<Category[]>
{
    const res = await fetch('api/categories');
    const json: ApiResponse<Category[] > | ApiErrorResponse = await res.json();

    if(!json.success)
        return unwrapError(json);
    return json.data;
}

export async function getCategoryById(id: number): Promise<Category>
{
    const res = await fetch(`api/categories/${id}`);
    const json: ApiResponse<Category> | ApiErrorResponse = await res.json();
    if(!json.success) return unwrapError(json)
    return json.data;
}

export async function createCategory(data: CategoryInput): Promise<Category>
{
    const res = await fetch('/api/categories', 
        {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

      const json: ApiResponse<Category> | ApiErrorResponse = await res.json();
  if (!json.success) return unwrapError(json);
  return json.data;
}

export async function updateCategory(id: number, data: Partial<CategoryInput>) : Promise<Category>
{
    const res = await fetch('/api/categories', 
        {
            method: 'PUT',
            headers: {'Content-Type': 'applicatin/json'},
            body: JSON.stringify(data),

        });

    const json: ApiResponse<Category> | ApiErrorResponse = await res.json()
    if(!json.success)
        return unwrapError(json)

    return json.data
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
  if (res.status === 204) return;
  const json: ApiErrorResponse = await res.json();
  unwrapError(json);
}

