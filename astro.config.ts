import { defineConfig } from 'astro/config'
import { loadEnv } from 'vite'

import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'

import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import rehypeExpressiveCode from 'rehype-expressive-code'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import rehypeShiki from '@shikijs/rehype'
import remarkEmoji from 'remark-emoji'
import remarkMath from 'remark-math'

import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import type { ExpressiveCodeTheme } from 'rehype-expressive-code'

import tailwindcss from '@tailwindcss/vite'
import { resolveSiteUrl } from './src/lib/site-config'
import alpinejs from '@astrojs/alpinejs';
import cloudflare from '@astrojs/cloudflare'
import node from '@astrojs/node' 
const siteEnv = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '')

const isProduction = process.env.NODE_ENV === 'production' || process.env.CF_PAGES === '1'

export default defineConfig({
  site: resolveSiteUrl(siteEnv),
  // NOTE: prefetch config removed — Astro 6.0.2 dev-mode prefetch client breaks under
  // Vite dep optimization (__PREFETCH_PREFETCH_ALL__ ReferenceError).
  // Cloudflare serves prerendered pages from edge anyway; re-test prefetch after Astro patch releases.
  adapter: isProduction ? cloudflare({ imageService: 'passthrough' })
  : node({mode : 'standalone'}),
  integrations: [mdx(), react(), sitemap(), icon(), alpinejs()],
  vite: {
    // Astro and the Tailwind Vite plugin can resolve slightly different Vite types.
    plugins: [tailwindcss() as any],
  },
  server: {
    port: 1234,
    host: true,
  },
  devToolbar: {
    enabled: false,
  },
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['nofollow', 'noreferrer', 'noopener'],
        },
      ],
      rehypeHeadingIds,
      rehypeKatex,
      [
        rehypeExpressiveCode,
        {
          themes: ['github-light', 'github-dark'],
          plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
          useDarkModeMediaQuery: false,
          themeCssSelector: (theme: ExpressiveCodeTheme) =>
            `[data-theme="${theme.name.split('-')[1]}"]`,
          defaultProps: {
            wrap: true,
            collapseStyle: 'collapsible-auto',
            overridesByLang: {
              'ansi,bat,bash,batch,cmd,console,powershell,ps,ps1,psd1,psm1,sh,shell,shellscript,shellsession,text,zsh':
                {
                  showLineNumbers: false,
                },
            },
          },
          styleOverrides: {
            codeFontSize: '0.75rem',
            borderColor: 'var(--border)',
            codeFontFamily: 'var(--font-mono)',
            codeBackground:
              'color-mix(in oklab, var(--muted) 25%, transparent)',
            frames: {
              editorActiveTabForeground: 'var(--muted-foreground)',
              editorActiveTabBackground:
                'color-mix(in oklab, var(--muted) 25%, transparent)',
              editorActiveTabIndicatorBottomColor: 'transparent',
              editorActiveTabIndicatorTopColor: 'transparent',
              editorTabBorderRadius: '0',
              editorTabBarBackground: 'transparent',
              editorTabBarBorderBottomColor: 'transparent',
              frameBoxShadowCssValue: 'none',
              terminalBackground:
                'color-mix(in oklab, var(--muted) 25%, transparent)',
              terminalTitlebarBackground: 'transparent',
              terminalTitlebarBorderBottomColor: 'transparent',
              terminalTitlebarForeground: 'var(--muted-foreground)',
            },
            lineNumbers: {
              foreground: 'var(--muted-foreground)',
            },
            uiFontFamily: 'var(--font-sans)',
          },
        },
      ],
      [
        rehypeShiki,
        {
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
          inline: 'tailing-curly-colon',
        },
      ],
    ],
    remarkPlugins: [remarkMath, remarkEmoji],
  },
})
