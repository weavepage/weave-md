#!/usr/bin/env node
/**
 * flatten.mjs — CLI wrapper around `flattenWeaveDocument` from @weave-md/parse.
 *
 * Reads a main markdown file, discovers the node files in its directory tree,
 * flattens the reference graph into the canonical JSONL bundle, and writes a
 * derived plain-markdown reading view alongside it. All flattening logic lives
 * in the library; this only does disk I/O and reporting.
 *
 * Usage:
 *   node scripts/flatten.mjs <mainFile.md> [--out <path.jsonl>] [--md <path.md>]
 *
 * Example (the bundled demo lives in the sibling `weave` repo):
 *   node scripts/flatten.mjs ../weave/demo/test-example/intro.md
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { flattenWeaveDocument, recordsToJsonl, recordsToMarkdown } from "@weave-md/parse";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Directories that never hold authored source — skip them so a built `dist/`
// copy can't shadow or duplicate the real files.
const SKIP_DIRS = new Set(["dist", "node_modules", ".git"]);

/** Recursively collect every `.md` file under `root`. */
function collectMarkdownFiles(root) {
  const out = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) out.push(...collectMarkdownFiles(full));
    } else if (entry.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

function main() {
  const argv = process.argv.slice(2);
  let mainFile = null;
  let outPath = null;
  let mdPath = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") outPath = argv[++i];
    else if (argv[i] === "--md") mdPath = argv[++i];
    else if (!mainFile) mainFile = argv[i];
  }
  if (!mainFile) {
    console.error("Usage: node scripts/flatten.mjs <mainFile.md> [--out <path.jsonl>] [--md <path.md>]");
    process.exit(1);
  }

  const mainAbs = resolve(mainFile);
  const docRoot = dirname(mainAbs);

  // Read every file in the document tree; paths are relative to the doc root.
  const files = collectMarkdownFiles(docRoot).map((abs) => ({
    path: relative(docRoot, abs),
    content: readFileSync(abs, "utf8"),
  }));

  const result = flattenWeaveDocument(files, { mainPath: relative(docRoot, mainAbs) });

  const jsonlOut = resolve(outPath ?? join(docRoot, basename(mainAbs).replace(/\.md$/, "") + ".jsonl"));
  const mdOut = resolve(mdPath ?? join(docRoot, basename(mainAbs).replace(/\.md$/, "") + ".flat.md"));
  writeFileSync(jsonlOut, recordsToJsonl(result.records));
  writeFileSync(mdOut, recordsToMarkdown(result.records));

  console.log(`Flattened ${result.records.length} file(s) from ${relative(REPO_ROOT, mainAbs)}`);
  console.log(`  canonical JSONL -> ${relative(REPO_ROOT, jsonlOut)}`);
  console.log(`  derived markdown -> ${relative(REPO_ROOT, mdOut)}`);
  console.log(`  reachable from main: ${result.records.length - result.orphans.length}, orphans: ${result.orphans.length}`);
  if (result.missing.length) console.log(`  ! unresolved node refs: ${[...new Set(result.missing)].join(", ")}`);
  if (result.orphans.length) console.log(`  ! never referenced from main: ${result.orphans.join(", ")}`);
  if (result.duplicates.length) console.log(`  ! duplicate ids: ${result.duplicates.map((d) => `${d.id} (${d.kept} vs ${d.dropped})`).join("; ")}`);
  if (result.skipped.length) console.log(`  ! skipped (parse error): ${result.skipped.map((s) => `${s.path}: ${s.error}`).join("; ")}`);
}

main();
