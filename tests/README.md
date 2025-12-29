# Tests

Internal tests for the weave-md repository.

## Test Files

- **`conformance.validate.test.ts`** — Tests `@weave-md/validate` against conformance fixtures
- **`conformance.parse.test.ts`** — Tests `@weave-md/parse` against conformance fixtures
- **`validate-spec.test.ts`** — Validates repo structure (spec files, schemas, READMEs)
- **`exports.test.ts`** — Validates package exports

## Usage

```bash
pnpm test              # All tests
pnpm test:validate     # Only validate conformance
pnpm test:parse        # Only parse conformance
```

## For External Implementers

The conformance fixtures in `conformance/` are the normative test cases. Write your own test harness that parses `.md` files and compares against `.ast.json` and `.graph.json`.
