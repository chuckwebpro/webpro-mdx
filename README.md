# Webpro MDX Editor

Offline desktop editor for writing **WEBPRO SEO Insights** articles in near-WYSIWYG mode. Exports publish-ready `.mdx` files and images for the webpro Astro site.

## Quick start

Open a terminal **in this folder** (not inside Cursor's sandbox) and run:

```bash
npm install
npm run tauri:dev
```

First launch compiles Rust dependencies and may take several minutes.

### Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| Node.js 20+ | Frontend build | [nodejs.org](https://nodejs.org/) |
| Rust | Tauri desktop shell | [rustup.rs](https://rustup.rs/) |

On Windows, after installing Rust, restart your terminal so `cargo` is on PATH.

## Two run modes

| Command | What it does |
|---------|--------------|
| `npm run dev` | Browser-only preview. Drafts saved in localStorage. Good for UI testing. |
| `npm run tauri:dev` | **Full desktop app.** Real file storage, import/export, image picker. |

## Workflow

1. **+ New** — create an article
2. Fill in frontmatter (title, subtitle, publish date required)
3. Write body in the MDX editor; use **Insert Component** for `Verdict`, `Specimen`, etc.
4. **Insert Image** adds a `<Shot>` (desktop app only)
5. Check live preview on the right
6. **Export** — produces a folder with `.mdx`, `images/`, and `README.txt`
7. Copy into webpro:
   - `{slug}.mdx` → `webpro/src/content/seo-insights/`
   - `images/*` → `webpro/public/images/seo-insights/`

## Draft storage (desktop)

Default location: `Documents/WebproArticles/`

```
my-article-slug/
├── meta.json
├── body.mdx
└── assets/
```

Change the folder via the ⚙ button in the sidebar.

## Troubleshooting

### `npm install` fails or hangs

- Run in your own terminal (Git Bash, PowerShell, or Windows Terminal)
- If you see `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, your network may be intercepting HTTPS. Try off VPN, or temporarily: `npm config set strict-ssl false` (re-enable after)

### `cargo` or `rustc` not found

Install Rust from [rustup.rs](https://rustup.rs/) and restart your terminal.

### VS Code "failed to parse package.json"

The file must be valid JSON. Verify with: `node -e "JSON.parse(require('fs').readFileSync('package.json'))"`

### Icons missing before first Tauri build

```bash
npm run icons
```

## Components

All 11 webpro SEO Insights MDX components are supported via **Insert Component**. See `docs/SEO-INSIGHTS-AUTHORING.md` in the webpro repo for usage details.

`InsightsCrescendo` is configured via frontmatter (`crescendoHeading`, `crescendoBody`), not inserted in the body.

## Build installer

```bash
npm run tauri:build
```

Output: `src-tauri/target/release/bundle/`
