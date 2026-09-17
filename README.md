# Webpro MDX Editor

Offline desktop editor for writing **WEBPRO SEO Insights** articles in near-WYSIWYG mode. Exports publish-ready `.mdx` files and images for the webpro Astro site, or publishes directly to GitHub.

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
| Node.js 20+ | Frontend build, Prettier formatting | [nodejs.org](https://nodejs.org/) |
| Rust | Tauri desktop shell | [rustup.rs](https://rustup.rs/) |

On Windows, after installing Rust, restart your terminal so `cargo` is on PATH.

## Two run modes

| Command | What it does |
|---------|--------------|
| `npm run dev` | Browser-only preview. Drafts saved in localStorage. Good for UI testing. |
| `npm run tauri:dev` | **Full desktop app.** Real file storage, import/export, image picker, GitHub publish. |

## Workflow

1. **+ New** — create an article
2. Fill in frontmatter (title, subtitle, publish date required)
3. Write body in the MDX editor; use **Insert Component** for `Verdict`, `Specimen`, etc.
4. **Insert Image** adds a `<Shot>` (desktop app only)
5. Check live preview on the right
6. **Export** or **Publish** (desktop only)

### Import from webpro (desktop)

Pull existing SEO Insights articles from the webpro repo into local drafts for editing:

1. Click **From webpro…** in the sidebar
2. Choose a source:
   - **GitHub** — uses your saved PAT and Settings repo (`chuckwebpro/webpro` by default). Requires **Contents: Read** (included in the publish token).
   - **Local folder** — pick your webpro checkout on disk (works offline). The app remembers the last path.
3. Select articles from the list (already-imported slugs are marked and skipped)
4. Click **Import selected** or **Import all**

Each imported article becomes a local draft with `meta.json`, `body.mdx`, and images copied into `assets/`. Image paths are rewritten from `/images/seo-insights/…` back to `assets/…` for editor preview.

Use **Import** (without “From webpro”) to bring in a standalone `.mdx` file from anywhere.

### Titles with accent markup

Hero titles may include inline HTML for accent styling, e.g. `Wolf. <span class="accent">Wolf.</span> Wolf.` The editor preview and webpro article page render that markup; the browser `<title>` tag uses plain text (stripped in webpro). In this app, slugs and sidebar labels always derive from the plain-text title, while the published `title` frontmatter field keeps the HTML for the hero.

### Export (manual)

Produces a zip with Prettier-formatted `{slug}.mdx`, `images/`, and `README.txt`. Copy into webpro:

- `{slug}.mdx` → `webpro/src/content/seo-insights/`
- `images/*` → `webpro/public/images/seo-insights/`

### Publish to GitHub (desktop)

Pushes directly to `main` on `chuckwebpro/webpro` via the GitHub API. CI runs `astro check` and `prettier --check`; deploy runs automatically if CI passes.

**Repo owner setup (one-time per author):**

1. On GitHub: `chuckwebpro/webpro` → Settings → Collaborators
2. Invite the author's GitHub username with **Write** access
3. Author accepts the invite

**Author setup (one-time per machine):**

1. Create a fine-grained personal access token on GitHub:
   - Open [Fine-grained tokens → Generate new token](https://github.com/settings/personal-access-tokens/new)
   - Name it (e.g. `Webpro MDX Editor`) and choose an expiration
   - **Repository access:** Only select repositories → `chuckwebpro/webpro`
   - **Repository permissions:** Contents → **Read and write**
   - Generate the token and copy it immediately (GitHub shows it only once)
   - *Alternative:* [Classic token with `repo` scope](https://github.com/settings/tokens/new?scopes=repo&description=Webpro%20MDX%20Editor) if you only need access to this repo
2. In the editor: **Settings (⚙)** → expand **How to create a personal access token** if needed → paste token → **Save token** → **Test connection**
3. Use **Publish** on an article when ready

Each author uses their own GitHub account and PAT, stored in the OS keychain — nothing shared in the app or repo.

**After publish (manual follow-ups, if needed):**

- Per-slug SEO overrides in `webpro/src/lib/article-seo.ts`
- JSON-LD files in `webpro/schema stuff/`
- Slug renames leave the old MDX file in the repo until manually removed

## Draft storage (desktop)

Default location: `Documents/WebproArticles/`

```
my-article-slug/
├── meta.json
├── body.mdx
└── assets/
```

Change the folder via **Settings (⚙)** in the sidebar.

## Prettier formatting

Export and Publish run Prettier with the same config as webpro (`.prettierrc.json`) before upload — including both `prettier-plugin-astro` and `prettier-plugin-tailwindcss`. This requires **Node.js on PATH** when using the desktop app — the same Node used for `npm install` / `npm run tauri:dev`.

Keep `.prettierrc.json` and Prettier plugin versions in sync with the webpro repo when webpro updates formatting rules.

If CI reports `prettier --check` failures on a published article, re-publish from the editor (after updating to a build with matching Prettier plugins) or run `npx prettier --write src/content/seo-insights/{slug}.mdx` in the webpro repo.

## Troubleshooting

### `npm install` fails or hangs

- Run in your own terminal (Git Bash, PowerShell, or Windows Terminal)
- If you see `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, your network may be intercepting HTTPS. Try off VPN, or temporarily: `npm config set strict-ssl false` (re-enable after)

### `cargo` or `rustc` not found

Install Rust from [rustup.rs](https://rustup.rs/) and restart your terminal.

### Prettier / export / publish fails

Ensure Node.js 20+ is installed and on PATH. Run `npm install` in this project folder so `scripts/format-mdx.mjs` can load Prettier.

### GitHub publish denied (403)

Your token may be invalid, expired, or missing write access. Ask the repo owner to invite your GitHub account as a collaborator, then **Test connection** again in Settings.

### VS Code "failed to parse package.json"

The file must be valid JSON. Verify with: `node -e "JSON.parse(require('fs').readFileSync('package.json'))"`

### Icons missing before first Tauri build

```bash
npm run icons
```

## Components

All 18 webpro SEO Insights MDX body components are supported via **Insert Component**. See `docs/SEO-INSIGHTS-AUTHORING.md` in the webpro repo for usage details.

`InsightsCrescendo` is configured via frontmatter (`crescendoHeading`, `crescendoBody`), not inserted in the body.

## Build installer

```bash
npm run tauri:build
```

Output: `src-tauri/target/release/bundle/`
