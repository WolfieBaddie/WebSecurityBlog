import
{
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    type Category
} from "../../lib/category-utils"

export function createCategoryEditor()
{
    return {
        categories: []  as Category[],
        isLoading: false,
        isSaving: false,
        editingId: null as number | null,
        form: {name: '', description: ''},
        error: null as string | null,

        async init()
        {
            await this.loadCategories()
        },

        async loadCategories()
        {
            this.isLoading = true;
            try
            {
                this.categories = await getAllCategories();
            }catch(err: any){
                this.error = err.message;
            }
            finally{
                this.isLoading = false;
            }
        },

        startCreate(){
            this.editingId = null;
            this.form = {name: '', description: ''};
            this.error = null;
        },

        slugify(name: string)
        {
            return name
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '') || '...';
        },

        startEdit(category: Category)
        {
            this.editingId = category.id;
            this.form = {name: category.name, description: category.description || ''}
            this.error = null;
        },

        async save()
        {
            if(!this.form.name.trim())
                {
                    this.error = "Category name is required";
                    return;
                }

            this.isSaving = true;
            this.error = null;

            try{
                if(this.editingId)
                    await updateCategory(this.editingId, this.form)
                else
                    await createCategory(this.form);
                
                await this.loadCategories();
                this.startCreate();
            }catch(err: any)
            {
                this.error = err.message;
            }
            finally
            {
                this.isSaving = false;
            }
        },

        async remove(id: number)
        {
            if(!confirm('Delete this category?')) return;

            try
            {
                await deleteCategory(id);
                this.categories = this.categories.filter((c) => c.id !== id);
            }
            catch(err: any)
            {
                alert(err.message)
            }
        }
    }
}

(window as any).createCategoryEditor = createCategoryEditor;