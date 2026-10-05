// Pure TypeScript - Full typing, autocomplete, clean imports
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
    importJson: '',
    form: {
      title: '',
      slug: '',
      summary: '',
      contentType: 'article',
      status: 'draft',
      blocks: [] as PostBlock[],
    },

    importFromJson(rawJson: string) {
      try {
        const parsed = JSON.parse(rawJson);

        if (!parsed.title || !parsed.slug || !Array.isArray(parsed.blocks)) {
          this.importError = 'JSON must contain at least: title, slug, blocks[]';
          return;
        }

        this.form.title = parsed.title;
        this.form.slug = parsed.slug;
        this.form.summary = parsed.summary || '';
        this.form.contentType = parsed.contentType || 'article';
        this.form.status = parsed.status || 'draft';
        this.form.blocks = parsed.blocks.map((b: any, i: number) => ({
          blockType: b.blockType,
          orderIndex: b.orderIndex ?? i,
          assetId: b.assetId ?? null,
          payload: b.payload || {},
        }));

        this.importError = null;
        this.showImport = false;
      } catch {
        this.importError = 'Invalid JSON — check syntax and try again';
      }
    },

    async init() {
      if (!this.isEditMode || !this.postId || this.postId === 'undefined' || this.postId === 'new') {
        return;
      }

      try {
        const res = await fetch(`/api/posts/admin/${this.postId}`);
        const json = await res.json();
        if (json.success) {
          this.form = {
            title: json.data.title || '',
            slug: json.data.slug || '',
            summary: json.data.summary || '',
            contentType: json.data.contentType || 'article',
            status: json.data.status || 'draft',
            blocks: json.data.blocks || [],
          };
        }
      } catch (err) {
        console.error('Failed to load post', err);
      }
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
            authorId: '00000000-0000-0000-0000-000000000000',
          }),
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || 'Failed to save');

        alert('Saved successfully!');
        if (!this.isEditMode && json.data?.id) {
          window.location.href = `/admin/posts/${json.data.id}`;
        }
      } catch (err: any) {
        alert(err.message);
      } finally {
        this.isSaving = false;
      }
    },
  };
}

// Register on window for Alpine
(window as any).postEditor = createPostEditor;