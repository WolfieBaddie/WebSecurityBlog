// Pure TypeScript - Full typing, autocomplete, clean imports
import { getAllCategories } from '@/lib/category-utils';
// Matches the DropdownSelect component's option contract
interface CategoryOption {
  value: number;
  label: string;
  description?: string;
}

export interface PostBlock {
  blockType: string;
  orderIndex: number;
  assetId?: string | null;
  payload: Record<string, any>;
}

export interface PostEditorForm {
  title: string;
  slug: string;
  summary: string;
  contentType: string;
  status: string;
  categoryId: number | null;
  blocks: PostBlock[];
}

export interface PostEditorOptions {
  isEditMode: boolean;
  postId?: string;
}


export function createPostEditor({ isEditMode, postId = '' }: PostEditorOptions)  {
  return {
    isEditMode: Boolean(isEditMode && postId && postId !== 'new'),
    postId: postId || '',
    isSaving: false,
    isUploading: false,
    uploadError: null as string | null,
    showImport: false,
    importError: null as string | null,
    importSuccess: null as string | null,
    importJson: '',
    categories: [] as CategoryOption[],
    form: {
      title: '',
      slug: '',
      summary: '',
      contentType: 'article',
      status: 'draft',
      categoryId: null as number | null,
      blocks: [] as PostBlock[],
    },

    async init() {
      // Categories are needed in BOTH create and edit mode.
      // API shape { id, name, description } → dropdown contract { value, label, description }
      try {
        const cats = await getAllCategories();
        this.categories = cats.map((c) => ({
          value: c.id,
          label: c.name,
          description: c.description || '',
        }));
      } catch (err: any) {
        console.error('Failed to load categories', err);
      }

      if (!this.isEditMode || !this.postId || this.postId === 'undefined' || this.postId === 'new') {
        return;
      }

      try {
        const res = await fetch(`/api/posts/admin/${this.postId}`);
        const json = await res.json();
        if (json.success && json.data) {
          this.form = {
            title: json.data.title || '',
            slug: json.data.slug || '',
            summary: json.data.summary || '',
            contentType: json.data.contentType || 'article',
            status: json.data.status || 'draft',
            categoryId: json.data.categoryId ?? null,
            blocks: json.data.blocks || [],
          };
        }
      } catch (err) {
        console.error('Failed to load post', err);
      }
    },

    // Sanitize invisible characters that break JSON.parse:
    // BOM, zero-width, soft hyphens, directional/bidi marks, NBSP, smart quotes
    sanitizeInvisible(raw: string): string {
      return raw
        .replace(/^\uFEFF/, '')
        .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\uFEFF\u00AD\u180E]/g, '')
        .replace(/\u00A0/g, ' ')
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u2028\u2029]/g, '\n');
    },

    // Tolerant JSON extractor: handles markdown fences, prose wrappers, trailing junk
    extractJson(raw: string): any {
      let text = this.sanitizeInvisible(raw);

      // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
      const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fence) text = fence[1].trim();

      // 2. Slice to the outermost curly braces (removes surrounding prose)
      const first = text.indexOf('{');
      const last = text.lastIndexOf('}');
      if (first !== -1 && last > first) {
        text = text.slice(first, last + 1);
      }

      try {
        let parsed = JSON.parse(text);

        // 3. Double-encoded output ("{\"title\": ...}") — parse one more level
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }

        return parsed;
      } catch (err: any) {
        // Hex-dump the first characters so an invisible culprit is identifiable
        const preview = JSON.stringify(text.slice(0, 40));
        const hex = Array.from(text.slice(0, 16))
          .map((c) => c.codePointAt(0)!.toString(16).padStart(4, '0'))
          .join(' ');
        throw new Error(`${err.message} | parse target starts with ${preview} | hex: ${hex}`);
      }
    },

    importFromJson(rawJson: string) {
      const ALLOWED_TYPES = ['markdown', 'code_snippet', 'image', 'callout', 'interactive_quiz', 'challenge_ref'];

      if (!rawJson || !rawJson.trim()) {
        this.importError = 'Paste the agent JSON output first';
        return;
      }

      let parsed: any;
      try {
        parsed = this.extractJson(rawJson);
      } catch (err: any) {
        this.importError = `Import failed — ${err.message}`;
        return;
      }

      if (!parsed || !parsed.title || !parsed.slug || !Array.isArray(parsed.blocks)) {
        this.importError = 'JSON must contain at least: title, slug, blocks[]';
        return;
      }

      // Reject unknown block types with the exact offender listed (server CHECK would 500 otherwise)
      const unknown = parsed.blocks
        .map((b: any, i: number) => ({ i, type: b?.blockType }))
        .filter((b: any) => !ALLOWED_TYPES.includes(b.type));
      if (unknown.length > 0) {
        this.importError = `Unknown blockType at block #${unknown
          .map((u: any) => u.i + 1)
          .join(', #')}. Allowed: ${ALLOWED_TYPES.join(', ')}`;
        return;
      }

      this.form.title = parsed.title;
      this.form.slug = parsed.slug;
      this.form.summary = parsed.summary || '';
      this.form.contentType = parsed.contentType || 'article';
      this.form.status = parsed.status || 'draft';
      this.form.categoryId = parsed.categoryId ? Number(parsed.categoryId) : null;
      this.form.blocks = parsed.blocks.map((b: any, i: number) => ({
        blockType: b.blockType,
        orderIndex: typeof b.orderIndex === 'number' ? b.orderIndex : i,
        assetId: b.assetId ?? null,
        payload: b.payload || {},
      }));

      this.importError = null;
      this.importSuccess = `Imported "${parsed.title}" — ${this.form.blocks.length} blocks loaded. Add your images, then save.`;
    },

    addBlock(type: string) {
      this.form.blocks.push({
        blockType: type,
        orderIndex: this.form.blocks.length,
        payload: {},
      });
    },

    removeBlock(idx: number) {
      this.form.blocks.splice(idx, 1);
    },

    async uploadImage(event: Event, blockIndex: number) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      this.isUploading = true;
      this.uploadError = null;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || 'Upload failed');

        this.form.blocks[blockIndex].payload.url = json.data.webContentLink;
        this.form.blocks[blockIndex].assetId = json.data.id;
      } catch (err: any) {
        this.uploadError = err.message;
        alert(`Upload failed: ${err.message}`);
      } finally {
        this.isUploading = false;
        input.value = '';
      }
    },

    async savePost() {
      this.isSaving = true;
      try {
        const url = this.isEditMode ? `/api/posts/${this.postId}` : '/api/posts';
        const method = this.isEditMode ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...this.form,
            // <select> binds strings — convert to number|null for the integer FK
            categoryId: this.form.categoryId ? Number(this.form.categoryId) : null,
          }),
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || 'Failed to save');

        window.notify?.success(
          this.isEditMode ? `"${this.form.title}" updated` : `"${this.form.title}" staged as draft`,
          'Note saved'
        );
        if (!this.isEditMode && json.data?.id) {
          window.location.href = `/admin/posts/${json.data.id}`;
        }
      } catch (err: any) {
        window.notify?.error(err.message, 'Save failed');
      } finally {
        this.isSaving = false;
      }
    },
  };
}

// ── Order-safe Alpine registration ─────────────────────────────
function registerPostEditor(Alpine: any) {
  Alpine.data(
    'postEditor',
    (opts?: { isEditMode?: boolean; postId?: string }) =>
      createPostEditor(opts ?? { isEditMode: false, postId: '' })
  );
}

if ((window as any).Alpine) {
  registerPostEditor((window as any).Alpine);
  queueMicrotask(() => (window as any).Alpine.initTree?.(document.body));
} else {
  document.addEventListener(
    'alpine:init',
    () => registerPostEditor((window as any).Alpine),
    { once: true }
  );
}