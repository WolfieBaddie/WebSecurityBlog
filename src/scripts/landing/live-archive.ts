// Live landing-page archive: fetches published posts from the API and powers
// the ContentToolbar (search / filter / sort) with zero page reloads.

export interface LivePost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  contentType: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

export function createLiveArchive() {
  return {
    posts: [] as LivePost[],
    loading: true,
    loadError: null as string | null,
    searchQuery: '',
    sortBy: 'date_desc',
    activeFilter: 'all',
    copiedSlug: null as string | null,

    async init() {
      try {
        const res = await fetch('/api/posts');
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || 'Failed to load the archive');

        this.posts = json.data || [];

        if (this.posts.length > 0) {
          window.notify?.info(`${this.posts.length} notes synced from the lab`, 'Archive live');
        }
      } catch (err: any) {
        this.loadError = err.message || 'Archive unavailable';
        window.notify?.error(this.loadError, 'Archive unavailable');
      } finally {
        this.loading = false;
      }
    },

    // Matches the ContentToolbar contract (processedPosts.length + getFilterClass)
    get processedPosts(): LivePost[] {
      let result = this.posts;

      if (this.activeFilter !== 'all') {
        result = result.filter((p) => p.contentType === this.activeFilter);
      }

      if (this.searchQuery && this.searchQuery.trim() !== '') {
        const q = this.searchQuery.toLowerCase().trim();
        result = result.filter(
          (p) =>
            (p.title && p.title.toLowerCase().includes(q)) ||
            (p.slug && p.slug.toLowerCase().includes(q)) ||
            (p.summary && p.summary.toLowerCase().includes(q))
        );
      }

      return result.slice().sort((a, b) => {
        const da = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const db = new Date(b.publishedAt || b.createdAt || 0).getTime();
        if (this.sortBy === 'date_asc') return da - db;
        if (this.sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '');
        if (this.sortBy === 'title_desc') return (b.title || '').localeCompare(a.title || '');
        return db - da; // date_desc (default)
      });
    },

    getFilterClass(id: string) {
      return this.activeFilter === id
        ? 'text-white border-b-2 border-white'
        : 'text-white/40 hover:text-white';
    },

    formatDate(iso: string | null): string {
      if (!iso) return 'Unscheduled';
      try {
        return new Date(iso).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        });
      } catch {
        return '—';
      }
    },

    async copyLink(slug: string) {
      try {
        const url = `${window.location.origin}/blog/${slug}`;
        await navigator.clipboard.writeText(url);
        this.copiedSlug = slug;
        window.notify?.success(`/blog/${slug}`, 'Link copied');
        setTimeout(() => (this.copiedSlug = null), 1600);
      } catch {
        window.notify?.error('Clipboard blocked by the browser', 'Copy failed');
      }
    },
  };
}

// Export for the order-safe registration pattern
export default createLiveArchive;
