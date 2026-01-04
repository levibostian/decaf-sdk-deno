// a decaf script test runner essentially. Copied from decaf: https://github.com/levibostian/decaf/blob/a0e324f7209c0f37b9d275b7259fcefd591a17c6/steps/get-next-release.test.ts#L4

import type {
  DeployStepInput,
  GetLatestReleaseStepInput,
  GetLatestReleaseStepOutput,
  GetNextReleaseVersionStepInput,
  GetNextReleaseVersionStepOutput,
} from "../main.ts"
import { readFile, tempfile, writeFile } from "@cross/fs"
import { spawn, stripAnsi } from "@cross/utils"

export async function runGetLatestReleaseScript(
  runScriptShellCommand: string,
  input: GetLatestReleaseStepInput,
): Promise<{ code: number; output: GetLatestReleaseStepOutput | null; stdout: string[] }> {
  const inputFilePath = await writeInputToTempFile(input)

  const env = {
    ...defaultEnvVariables,
    DATA_FILE_PATH: inputFilePath,
  }

  const { code, output, stdout } = await runScript<GetLatestReleaseStepOutput>(runScriptShellCommand, env)

  return { code, output, stdout }
}

export async function runGetNextReleaseVersionScript(
  runScriptShellCommand: string,
  input: GetNextReleaseVersionStepInput,
): Promise<{ code: number; output: GetNextReleaseVersionStepOutput | null; stdout: string[] }> {
  const inputFilePath = await writeInputToTempFile(input)

  const env = {
    ...defaultEnvVariables,
    DATA_FILE_PATH: inputFilePath,
  }

  const { code, output, stdout } = await runScript<GetNextReleaseVersionStepOutput>(runScriptShellCommand, env)

  return { code, output, stdout }
}

export async function runDeployScript(
  runScriptShellCommand: string,
  input: DeployStepInput,
): Promise<{ code: number; stdout: string[] }> {
const inputFilePath = await writeInputToTempFile(input)

  const env = {
    ...defaultEnvVariables,
    DATA_FILE_PATH: inputFilePath,
  }

  const { code, stdout } = await runScript<unknown>(runScriptShellCommand, env)

  return { code, stdout }
}

// TODO: use this in each function.
export interface RunScriptOptions {
  displayStdout?: boolean
  removeAnsiCodes?: boolean
}

const writeInputToTempFile = async (input: unknown): Promise<string> => {
  const tempFilePath = await tempfile("decaf-sdk")
  const inputFileContents = JSON.stringify(input)
  await writeFile(tempFilePath, inputFileContents, "utf-8")
  return tempFilePath
}

const defaultEnvVariables = {
  INPUT_GITHUB_TOKEN: "abcd1234",
  NO_COLOR: "1", // disable color output (anscii) for easier testing. https://docs.deno.com/api/deno/~/Deno.noColor
}

const splitLines = (text: string): string[] => {
  const normalized = text.replaceAll("\r\n", "\n")
  const lines = normalized.split("\n")

  // if the chunk ends with \n, last item is empty and should be ignored
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop()
  }

  return lines
}

export async function runScript<TOutput>(
  runScriptShellCommand: string,
  env: Record<string, string>,
): Promise<{ code: number; output: TOutput | null; stdout: string[] }> {
  const inputFilePath = env["DATA_FILE_PATH"]
  if (!inputFilePath) {
    throw new Error("DATA_FILE_PATH environment variable is not set.")
  }

  const inputFileContentsBeforeRun = await readFile(inputFilePath, "utf-8")

  // This code is the same idea as exec.ts in decaf.
  // Using 'sh -c' allows us to run complex commands that contain &&, |, >, etc.
  // We append "2>&1" to preserve the relative ordering between stdout and stderr.
  const { code, stdout } = await spawn(["sh", "-c", `${runScriptShellCommand} 2>&1`], env)

  const combinedOutput = splitLines(stdout)

  const outputFileContentsAfterRun = await readFile(inputFilePath, "utf-8")
  let output: TOutput | null = null
  if (outputFileContentsAfterRun !== inputFileContentsBeforeRun) {
    output = JSON.parse(outputFileContentsAfterRun) as TOutput
  }

  const combinedOutputWithoutAnsiCodes = combinedOutput.map((line) => stripAnsi(line))

  return { code, output, stdout: combinedOutputWithoutAnsiCodes }
}

