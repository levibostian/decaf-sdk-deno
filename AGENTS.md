# Agent Guidelines for decaf-sdk-deno

This document provides guidelines for AI coding agents working in this repository.

## Project Overview

This is a cross-runtime TypeScript SDK for building [decaf](https://github.com/levibostian/decaf/) step scripts. The SDK must work identically on Deno, Node.js, and Bun.

**Key Design Principles:**
- **Cross-runtime compatibility is CRITICAL** - All code must work on Deno, Node, and Bun
- Use `@cross/*` packages for platform-specific functionality (fs, env, utils)
- Never use runtime-specific APIs (e.g., `Deno.readTextFile`, `process.exit`) directly
- The testing module returns unmodified stdout/stderr output - filtering is the caller's responsibility

## Build/Test/Lint Commands

### Running Tests
```bash
# Run all tests with coverage
deno task test

# Run a single test file
deno test --allow-all testing/mod.test.ts

# Run a specific test by name
deno test --allow-all --filter "expect scripts able to access custom environment variables"

# Run tests in a specific file matching a pattern
deno test --allow-all --filter "stdout" testing/mod.test.ts
```

### Formatting and Linting
```bash
# Format code
deno task format
# or
deno fmt

# Lint and auto-fix
deno task lint
# or
deno lint --fix

# Both format and lint are run automatically on pre-commit via lefthook
```

### Manual Dependency Management
```bash
# Install/update dependencies (frozen lockfile)
deno install --frozen

# Update lockfile
deno install
```

## Code Style Guidelines

### Imports
- **Order:** Standard library → Third-party packages → Internal modules
- **Grouping:** Use `@cross/*` packages for cross-runtime compatibility
- **Style:** Use type imports when importing only types: `import type { ... }`
- **Relative imports:** Use `"../main.ts"` style with `.ts` extension

Example:
```typescript
import type { GitCommit, GetLatestReleaseStepInput } from "../main.ts"
import { readFile, tempfile, writeFile } from "@cross/fs"
import { spawn, stripAnsi } from "@cross/utils"
```

### Formatting
- **Line width:** 150 characters (configured in deno.json)
- **Semicolons:** NO semicolons (configured in deno.json)
- **Indentation:** 2 spaces
- **Trailing commas:** Use in multiline arrays/objects
- **Quotes:** Use double quotes for strings

### Types
- **Explicit types:** Always declare return types for exported functions
- **Interfaces over types:** Prefer `interface` for object shapes
- **JSDoc comments:** Add comprehensive JSDoc for all exported types and functions
- **Type parameters:** Use descriptive names like `TOutput` instead of single letters

Example:
```typescript
/**
 * Gets the input data for a "get latest release" step.
 * 
 * @returns The parsed input data containing Git repository information
 */
export const getLatestReleaseStepInput = (): GetLatestReleaseStepInput => {
  return getInput<GetLatestReleaseStepInput>()
}
```

### Naming Conventions
- **Functions:** `camelCase` (e.g., `runGetLatestReleaseScript`)
- **Interfaces/Types:** `PascalCase` (e.g., `GetLatestReleaseStepInput`)
- **Constants:** `UPPER_SNAKE_CASE` for environment variables (e.g., `DECAF_COMM_FILE_PATH`)
- **Private functions:** `camelCase` with `const` (e.g., `const getInput = ...`)
- **Exported vs private:** Only export what's needed in the public API

### Error Handling
- Use clear error messages that explain what went wrong
- Throw errors for unrecoverable conditions
- Example: `throw new Error("DECAF_COMM_FILE_PATH environment variable is not set.")`

### Functions
- **Arrow functions:** Use `const functionName = () => {}` for private functions
- **Export declarations:** Use `export const functionName = () => {}` or `export function`
- **Async:** Always use `async/await`, never raw Promises or callbacks
- **Default parameters:** Place optional parameters last with sensible defaults

Example:
```typescript
async function runScript<TOutput>(
  runScriptShellCommand: string,
  env: Record<string, string>,
  removeAnsiCodes = true,
  displayStdout = true,
): Promise<{ code: number; output: TOutput | null; stdout: string[] }> {
  // implementation
}
```

## Testing Guidelines

### Test Structure
- Use descriptive test names that explain behavior
- Group related tests logically
- Use `assertEquals` for exact matches, `assertNotEquals` for non-zero exit codes
- Tests should be deterministic and not depend on external state

### Test Files
- Test files use `.test.ts` suffix (e.g., `main.test.ts`)
- Test files are excluded from published package (see `deno.json` publish.exclude)
- Create temp files for test scripts using `Deno.makeTempFileSync()`
- **Tests do NOT need to be cross-runtime compatible** - Tests only run in Deno, so Deno-specific APIs are acceptable

### Testing Module Behavior
**IMPORTANT:** The `testing/mod.ts` module returns raw, unmodified stdout output:
- `stdout` is split by `"\n"` with NO filtering
- `console.log("hello")` outputs `"hello\n"`, resulting in `["hello", ""]` after split
- Tests must account for trailing empty strings in assertions
- Example: `assertEquals(stdout, ["test-value", ""])` ← note the `""`

## Cross-Runtime Compatibility

### DO ✅
```typescript
import { readFile, writeFile } from "@cross/fs"
import { spawn } from "@cross/utils"
import { getEnv } from "@cross/env"

const text = new TextDecoder().decode(chunk)  // Standard Web API
console.log(text)  // Standard API
```

### DON'T ❌
```typescript
import { readFileSync } from "node:fs"  // Node-specific (only OK in internal implementation)
Deno.readTextFile()  // Deno-specific
process.exit()  // Node-specific
Bun.file()  // Bun-specific
```

### Exception
The internal implementation in `main.ts` uses `node:fs` directly because the `@cross/fs` abstraction is simple enough to not warrant a dependency. This is intentional and documented in a comment.

## Git Hooks

Pre-commit hooks (via lefthook) automatically run:
1. `deno fmt` - Formats staged TypeScript files
2. `deno lint --fix` - Lints and fixes staged TypeScript files
3. Auto-stages fixed files

## Common Pitfalls

1. **Don't modify `testing/mod.ts` logic** - It returns unmodified output by design
2. **Cross-runtime for SDK only** - `main.ts` and `testing/mod.ts` must be cross-runtime compatible, but test files (`*.test.ts`) can use Deno-specific APIs
3. **Account for trailing newlines** - `console.log()` adds `\n`, creating empty strings when split
4. **Use explicit types** - TypeScript strict mode is enabled
5. **Respect line width** - 150 characters, not the typical 80/120

## Publishing

The package is published to JSR (jsr.io/@levibostian/decaf-sdk). Only include:
- `*.ts` files (excluding `*.test.ts`)
- `LICENSE`, `README.md`
- `deno.json`, `deno.lock`

## Additional Resources

- Main SDK: `./main.ts` - Core SDK functions
- Testing module: `./testing/mod.ts` - Test utilities
- GitHub CI: `.github/workflows/test.yml` - Automated testing pipeline
