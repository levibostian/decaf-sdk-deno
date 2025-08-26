/**
 * File system code
 * 
 * Be able to read and write files for Deno, Bun, and node. 
 * Got this code from: https://github.com/cross-org/fs but the code
 * is so small in size, not worth importing.
 */
import { readFileSync as nodeReadFileSync, writeFileSync as nodeWriteFileSync } from "node:fs"

/**
 * Cross-runtime compatible readFileSync
 */
export function readFileSync(path: string, encoding?: "utf-8"): string {
  return nodeReadFileSync(path, encoding ?? "utf-8") as string
}

/**
 * Cross-runtime compatible writeFileSync
 */
export function writeFileSync(path: string, data: string): void {
  return nodeWriteFileSync(path, data)
}