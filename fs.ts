/**
 * File system code
 * 
 * Be able to read and write files for Deno, Bun, and node. 
 * Got this code from: https://github.com/cross-org/fs but the code
 * is so small in size, not worth importing.
 */
export { readFileSync, writeFileSync } from "node:fs"