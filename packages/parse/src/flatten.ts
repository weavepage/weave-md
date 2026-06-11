/**
 * Flatten a multi-file Weave document into a self-describing bundle.
 *
 * A Weave "document" is an entry (main) file plus the node files it references
 * via `node:<id>` links — resolved by each file's frontmatter `id`, NOT its
 * filename. This walks the reference graph from the main file and produces one
 * record per file: `{ id, path, main?, frontmatter, links, body }`.
 *
 * Filesystem-agnostic: callers pass `{ path, content }` pairs, so this runs
 * unchanged in the browser, a server, or a build/CDN step. Disk I/O lives in
 * the CLI wrapper (scripts/flatten.mjs), not here.
 *
 * The records serialize to JSONL (the canonical/transport form — one record per
 * line, body as a JSON string, so file separation is always detectable
 * regardless of `---` or code-fence content) via {@link recordsToJsonl}. A
 * plain-markdown reading view is a cheap derived projection via
 * {@link recordsToMarkdown} — generated from the records, never parsed back.
 */

import { parseToMdast, parseWeaveDocument } from './parser.js'
import type { DisplayType } from './types.js'

/** One input file: a stable path/identifier plus its raw markdown. */
export interface FlattenFile {
  /** Stable path recorded in the output (e.g. "sections/foo.md"). */
  path: string
  /** Raw markdown, including frontmatter. */
  content: string
}

/** An outgoing node reference, as it appears in a file (occurrences kept). */
export interface FlattenLink {
  id: string
  display?: DisplayType
  text?: string
}

/** One file in the flattened bundle. */
export interface FlattenRecord {
  id: string
  path: string
  /** Present (true) only on the entry/main file. */
  main?: boolean
  frontmatter: { id: string; title?: string; peek?: string } & Record<string, unknown>
  /** Outgoing node references in document order. */
  links: FlattenLink[]
  /** Markdown body with frontmatter stripped. */
  body: string
}

export interface FlattenResult {
  /** Records in DFS pre-order from the main file; orphans appended last. */
  records: FlattenRecord[]
  /** ids of files never reached from the main file (still included in records). */
  orphans: string[]
  /** Referenced ids with no matching file (dangling `node:` links). */
  missing: string[]
  /** Files whose frontmatter id collided with an earlier file (the later one dropped). */
  duplicates: { id: string; kept: string; dropped: string }[]
  /** Files that failed to parse (e.g. missing/invalid frontmatter) and were skipped. */
  skipped: { path: string; error: string }[]
}

export interface FlattenOptions {
  /** Entry file, matched by input `path`. Takes precedence over `mainId`. */
  mainPath?: string
  /** Entry file, matched by frontmatter `id`. */
  mainId?: string
}

/** Parse one file into a record (without the `main` flag, set later). */
function toRecord(file: FlattenFile): FlattenRecord {
  // Frontmatter from parseToMdast so unknown keys (`extra`) survive — the
  // compiled AST folds them away. Body + outgoing links from the compiled AST.
  const { frontmatter } = parseToMdast(file.content)
  const ast = parseWeaveDocument(file.content)
  const section = ast.sections[0]

  const fm: FlattenRecord['frontmatter'] = { id: frontmatter.id }
  if (frontmatter.title !== undefined) fm.title = frontmatter.title
  if (frontmatter.peek !== undefined) fm.peek = frontmatter.peek
  if (frontmatter.extra) Object.assign(fm, frontmatter.extra)

  const links: FlattenLink[] = ast.links.map((l) => {
    const link: FlattenLink = { id: l.ref.id }
    if (l.ref.display) link.display = l.ref.display
    const text = l.text?.trim()
    if (text) link.text = text
    return link
  })

  return { id: frontmatter.id, path: file.path, frontmatter: fm, links, body: section ? section.body : '' }
}

/**
 * Flatten a set of Weave files into an ordered, deduplicated bundle.
 *
 * Resolution is by frontmatter `id` (filename is ignored). Traversal is a
 * cycle-safe DFS pre-order from the main file, following each file's links in
 * document order; files never referenced from main ("orphans") are appended so
 * the bundle stays complete. Dangling refs, duplicate ids, and unparseable
 * files are reported rather than thrown, so one bad file can't sink an archive.
 *
 * @throws if `files` is empty or the requested/defaulted main file is absent.
 */
export function flattenWeaveDocument(files: FlattenFile[], options: FlattenOptions = {}): FlattenResult {
  if (files.length === 0) throw new Error('flattenWeaveDocument: no files provided')

  // Index by frontmatter id (the resolution key), preserving input order so the
  // default main is the first successfully-parsed file.
  const byId = new Map<string, FlattenRecord>()
  const order: FlattenRecord[] = []
  const duplicates: FlattenResult['duplicates'] = []
  const skipped: FlattenResult['skipped'] = []
  for (const file of files) {
    let record: FlattenRecord
    try {
      record = toRecord(file)
    } catch (err) {
      skipped.push({ path: file.path, error: err instanceof Error ? err.message : String(err) })
      continue
    }
    const existing = byId.get(record.id)
    if (existing) {
      duplicates.push({ id: record.id, kept: existing.path, dropped: record.path })
      continue
    }
    byId.set(record.id, record)
    order.push(record)
  }

  // Resolve the entry file.
  let main: FlattenRecord | undefined
  if (options.mainPath !== undefined) main = order.find((r) => r.path === options.mainPath)
  else if (options.mainId !== undefined) main = byId.get(options.mainId)
  else main = order[0]
  if (!main) {
    const requested = options.mainPath ?? options.mainId ?? '(first file)'
    throw new Error(`flattenWeaveDocument: main file not found: ${requested}`)
  }
  main.main = true

  // Cycle-safe DFS pre-order. Iterative (explicit stack) so a deep reference
  // chain can't overflow the call stack; children pushed in reverse so they pop
  // in document order — yielding "expand each reference as you encounter it".
  const records: FlattenRecord[] = []
  const visited = new Set<string>()
  const missing: string[] = []
  const stack: string[] = [main.id]
  while (stack.length > 0) {
    const id = stack.pop() as string
    if (visited.has(id)) continue
    visited.add(id)
    const rec = byId.get(id)
    if (!rec) {
      missing.push(id)
      continue
    }
    records.push(rec)
    for (let i = rec.links.length - 1; i >= 0; i--) {
      if (!visited.has(rec.links[i].id)) stack.push(rec.links[i].id)
    }
  }

  // Append orphans (never referenced from main) so nothing is silently dropped.
  const orphanRecords = order.filter((r) => !visited.has(r.id)).sort((a, b) => a.path.localeCompare(b.path))
  records.push(...orphanRecords)

  return {
    records,
    orphans: orphanRecords.map((r) => r.id),
    missing,
    duplicates,
    skipped,
  }
}

/**
 * Serialize records to JSONL (the canonical form). One record per line, fields
 * in a stable order, body as a JSON string. Always detectable file separation.
 */
export function recordsToJsonl(records: FlattenRecord[]): string {
  return (
    records
      .map((r) => {
        const out: Record<string, unknown> = { id: r.id, path: r.path }
        if (r.main) out.main = true
        out.frontmatter = r.frontmatter
        out.links = r.links
        out.body = r.body
        return JSON.stringify(out)
      })
      .join('\n') + '\n'
  )
}

/**
 * Project records to a plain-markdown reading view. Each file is preceded by an
 * HTML-comment provenance marker (invisible when rendered). This is a derived
 * view — regenerable from the records and never parsed back into files.
 */
export function recordsToMarkdown(records: FlattenRecord[]): string {
  return (
    records
      .map((r) => {
        // Strip any `--` from interpolated values so they can't close the comment.
        const safe = (s: string) => s.replace(/--+/g, '-')
        const title = r.frontmatter.title ? ` title="${safe(String(r.frontmatter.title))}"` : ''
        return `<!-- weave:file id="${safe(r.id)}" path="${safe(r.path)}"${title} -->\n\n${r.body.trimEnd()}\n`
      })
      .join('\n') + '\n'
  )
}
