import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import * as prettierPluginAstro from 'prettier-plugin-astro';
import * as prettierPluginTailwindcss from 'prettier-plugin-tailwindcss';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '..', '.prettierrc.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

/** Must match plugin order in `.prettierrc.json` (tailwind last). */
const plugins = [prettierPluginAstro, prettierPluginTailwindcss];

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node format-mdx.mjs <file.mdx>');
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, 'utf8');
const basename = path.basename(inputPath.endsWith('.mdx') ? inputPath : `${inputPath}.mdx`);
// Match webpro repo path so Prettier resolves the same parser/plugins as CI (`prettier --check`).
const formatOptions = {
  ...config,
  filepath: path.join('src/content/seo-insights', basename),
  plugins,
};

const formatted = await prettier.format(raw, formatOptions);

const again = await prettier.format(formatted, formatOptions);

if (again !== formatted) {
  console.error('Prettier formatting is not idempotent');
  process.exit(2);
}

process.stdout.write(formatted);
