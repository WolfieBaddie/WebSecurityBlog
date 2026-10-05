# Agent Guide: Generating Post Content for This Website

You are generating content for a technical security blog. Your output will be fed into a
PostgreSQL-backed, block-based publishing system (Astro + Hono + Drizzle). Read every rule
below before writing. Output must be **valid JSON** matching the schema in this document —
the content is stored as ordered blocks, not as one giant markdown string.

---

## 1. The Post Model

Every post has metadata plus an ordered array of blocks.

```json
{
  "title": "string (required, max 255 chars)",
  "slug": "string (required, kebab-case, max 150 chars, URL-safe)",
  "summary": "string (1–2 sentences shown on archive cards, max ~200 chars)",
  "contentType": "article | writeup | cheatsheet | announcement",
  "status": "draft",
  "blocks": [Block, Block, ...]
}
```

### Field rules
- `slug`: lowercase, hyphens only, no dates, no stop-word soup. `heap-exploitation-101`, not
  `My Blog Post About Heap!!!`.
- `summary`: reader-facing hook. Never start with "This article...".
- `contentType`:
  - `article` — conceptual/educational technical writing
  - `writeup` — CTF solutions, incident reconstructions, lab walkthroughs
  - `cheatsheet` — dense reference material, commands, tables
  - `announcement` — site news, releases
- Always emit `"status": "draft"`. The human decides when to publish.

---

## 2. The Block Types (ONLY these four exist)

### 2.1 `markdown` — prose
```json
{
  "blockType": "markdown",
  "orderIndex": 0,
  "payload": { "content": "Prose written in **markdown**. Supports headings, lists, links, `inline code`, and tables." }
}
```
Rules:
- Headings inside markdown must start at `##` (h2). Never use `#` (h1) — the post title is
  already the h1.
- Keep prose blocks under ~400 words. Split longer sections into multiple markdown blocks.
- Prefer concrete specifics over filler. No "In today's world..." openers.

### 2.2 `code_snippet` — code with syntax context
```json
{
  "blockType": "code_snippet",
  "orderIndex": 1,
  "payload": {
    "language": "python",
    "filename": "exploit.py",
    "code": "payload = b\"A\" * 64\npayload += p64(0xdeadbeef)"
  }
}
```
Rules:
- `language`: real identifier — `python`, `c`, `bash`, `sql`, `javascript`, `nasm`, `powershell`, etc.
- `filename`: always provide one for scripts (`scan.sh`, `crack.py`); use `commands` for shell one-liners.
- Code must be complete and runnable in context — no `...` or `# code here` placeholders.
- Comment the *why*, not the *what*, inside code.

### 2.3 `image` — VISUAL PLACEHOLDER ONLY
```json
{
  "blockType": "image",
  "orderIndex": 2,
  "payload": {
    "url": "IMAGE-PLACEHOLDER: <short description of exactly what the image must show>",
    "caption": "Figure 1: <caption text shown under the image on the site>"
  }
}
```
**CRITICAL RULES — the human handles all images:**
- NEVER invent URLs. NEVER use placeholder image services (placekitten, via.placeholder, etc.).
  NEVER reference local file paths as if they were live.
- `url` MUST always start with the literal token `IMAGE-PLACEHOLDER:` followed by a precise
  art-direction note, e.g.:
  `IMAGE-PLACEHOLDER: terminal screenshot showing sqlmap dumping the users table, dark theme`
- `caption` must be real, publication-ready text — the human only supplies the pixels.
- Only request images where a visual genuinely adds value: screenshots, diagrams, proof output.
  Never request decorative stock imagery.

### 2.4 `callout` — security notices
```json
{
  "blockType": "callout",
  "orderIndex": 3,
  "payload": {
    "title": "Legal / Authorization Warning",
    "content": "These techniques must only be used on systems you own or have written permission to test."
  }
}
```
Rules:
- Use for: legal/ethics warnings, exploit prerequisites, common pitfalls, CVE references.
- Keep under 60 words. If it's longer, it should be a markdown block instead.

---

## 3. Ordering Rules

- `orderIndex` is a zero-based sequential integer: 0, 1, 2, 3... matching array position.
- A post MUST begin with a `markdown` block (the intro) and MUST end with a `markdown` block
  (wrap-up / mitigation / further reading). Code and images never start or end a post.
- Rhythm guide for writeups: markdown intro → callout (if warnings apply) → markdown setup →
  code → markdown analysis → image placeholder (proof) → markdown conclusion.
- Cheatsheets may be denser: markdown intro → many code blocks with one-line markdown
  separators between them.

---

## 4. Editorial Voice

- Audience: security practitioners and students. Assume competence, explain novel steps.
- Direct, technical, no hype. Prefer "The query concatenates user input, so `' OR 1=1--`
  authenticates the admin" over "SQL injection is a fascinating vulnerability!".
- Every claim about behavior should be backed by adjacent code or command output.
- For `writeup` posts always include: prerequisites, step-by-step progression, the actual
  payload/exploit, verification of success, and remediation.
- For `cheatsheet` posts: optimize for scanning. Short separator sentences, dense blocks.

---

## 5. Output Contract

Return ONLY a single JSON object (no surrounding prose, no markdown fences) shaped as:

```json
{
  "title": "...",
  "slug": "...",
  "summary": "...",
  "contentType": "writeup",
  "status": "draft",
  "blocks": [
    { "blockType": "markdown", "orderIndex": 0, "payload": { "content": "..." } },
    { "blockType": "code_snippet", "orderIndex": 1, "payload": { "language": "bash", "filename": "recon.sh", "code": "..." } },
    { "blockType": "image", "orderIndex": 2, "payload": { "url": "IMAGE-PLACEHOLDER: ...", "caption": "..." } },
    { "blockType": "callout", "orderIndex": 3, "payload": { "title": "...", "content": "..." } }
  ]
}
```

This JSON can then be:
- POSTed directly to `/api/posts`, or
- pasted into the admin editor's data flow by the human.

---

## 6. Minimal Worked Example

```json
{
  "title": "Stack Buffer Overflow on x86-64: A Minimal Lab",
  "slug": "stack-buffer-overflow-x86-64-lab",
  "summary": "Build a deliberately vulnerable binary, crash it, and redirect execution by overwriting the return address.",
  "contentType": "writeup",
  "status": "draft",
  "blocks": [
    {
      "blockType": "markdown",
      "orderIndex": 0,
      "payload": { "content": "## Why this lab exists\n\nModern mitigations (stack canaries, ASLR, NX) make real-world exploitation hard — but you cannot bypass what you do not understand. This lab disables all of them so we can observe the raw mechanics of control-flow hijack." }
    },
    {
      "blockType": "code_snippet",
      "orderIndex": 1,
      "payload": { "language": "c", "filename": "vuln.c", "code": "#include <string.h>\n#include <stdio.h>\n\nvoid win(void) {\n    puts(\"Execution redirected.\");\n}\n\nvoid vulnerable(const char *input) {\n    char buffer[64];\n    strcpy(buffer, input);\n}\n\nint main(int argc, char **argv) {\n    vulnerable(argv[1]);\n    return 0;\n}" }
    },
    {
      "blockType": "code_snippet",
      "orderIndex": 2,
      "payload": { "language": "bash", "filename": "commands", "code": "gcc -fno-stack-protector -no-pie -z execstack -o vuln vuln.c\ncyclic 200 > pattern.txt\n./vuln $(cat pattern.txt)" }
    },
    {
      "blockType": "image",
      "orderIndex": 3,
      "payload": { "url": "IMAGE-PLACEHOLDER: gdb backtrace output showing SIGSEGV at overwritten return address 0x6161616c6161616b", "caption": "Figure 1: Crash confirmation — RIP points into our cyclic pattern." }
    },
    {
      "blockType": "callout",
      "orderIndex": 4,
      "payload": { "title": "Authorization Notice", "content": "Exploit development must target only systems you own or are contractually authorized to test." }
    },
    {
      "blockType": "markdown",
      "orderIndex": 5,
      "payload": { "content": "## Wrap-up\n\nThe return address sits at offset 72 from `buffer`. In production you would now face canaries, ASLR and NX — each addressed in follow-up labs. Remediation is boring and effective: compile with `-fstack-protector-strong`, replace `strcpy` with bounds-checked copies, and treat all external input as hostile." }
    }
  ]
}
```
