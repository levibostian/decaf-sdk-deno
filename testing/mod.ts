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
  options?: RunScriptOptions,
): Promise<{ code: number; output: GetLatestReleaseStepOutput | null; stdout: string[] }> {
  const inputFilePath = await writeInputToTempFile(input)

  const env = getEnvironmentVariables(inputFilePath, options)

  const { code, output, stdout } = await runScript<GetLatestReleaseStepOutput>(
    runScriptShellCommand,
    env,
    options?.removeAnsiCodes,
    options?.displayStdout,
  )

  return { code, output, stdout }
}

export async function runGetNextReleaseVersionScript(
  runScriptShellCommand: string,
  input: GetNextReleaseVersionStepInput,
  options?: RunScriptOptions,
): Promise<{ code: number; output: GetNextReleaseVersionStepOutput | null; stdout: string[] }> {
  const inputFilePath = await writeInputToTempFile(input)

  const env = getEnvironmentVariables(inputFilePath, options)

  const { code, output, stdout } = await runScript<GetNextReleaseVersionStepOutput>(
    runScriptShellCommand,
    env,
    options?.removeAnsiCodes,
    options?.displayStdout,
  )

  return { code, output, stdout }
}

export async function runDeployScript(
  runScriptShellCommand: string,
  input: DeployStepInput,
  options?: RunScriptOptions,
): Promise<{ code: number; stdout: string[] }> {
  const inputFilePath = await writeInputToTempFile(input)

  const env = getEnvironmentVariables(inputFilePath, options)

  const { code, stdout } = await runScript<unknown>(runScriptShellCommand, env, options?.removeAnsiCodes, options?.displayStdout)

  return { code, stdout }
}

export interface RunScriptOptions {
  removeAnsiCodes?: boolean
  displayStdout?: boolean
  extraEnvVariables?: Record<string, string>
}

const writeInputToTempFile = async (input: unknown): Promise<string> => {
  const tempFilePath = await tempfile("decaf-sdk")
  const inputFileContents = JSON.stringify(input)
  await writeFile(tempFilePath, inputFileContents, "utf-8")
  return tempFilePath
}

const getEnvironmentVariables = (
  inputFilePath: string,
  options?: RunScriptOptions,
): Record<string, string> => {
  return {
    INPUT_GITHUB_TOKEN: "abcd1234",
    NO_COLOR: "1", // disable color output (ansi) for easier testing. https://docs.deno.com/api/deno/~/Deno.noColor
    DATA_FILE_PATH: inputFilePath,
    ...(options?.extraEnvVariables ?? {}),
  }
}

async function runScript<TOutput>(
  runScriptShellCommand: string,
  env: Record<string, string>,
  removeAnsiCodes = true,
  displayStdout = true,
): Promise<{ code: number; output: TOutput | null; stdout: string[] }> {
  const inputFilePath = env["DATA_FILE_PATH"]
  if (!inputFilePath) {
    throw new Error("DATA_FILE_PATH environment variable is not set.")
  }

  const inputFileContentsBeforeRun = await readFile(inputFilePath, "utf-8")

  let accumulatedOutput = ""

  const stdoutStream = new WritableStream({
    write(chunk: Uint8Array) {
      const text = new TextDecoder().decode(chunk)
      if (displayStdout) {
        console.log(text.slice(0, -1)) // remove extra new line added by writable stream
      }

      accumulatedOutput += text
    },
  })

  const stderrStream = new WritableStream({
    write(chunk: Uint8Array) {
      const text = new TextDecoder().decode(chunk)
      if (displayStdout) {
        console.error(text.slice(0, -1)) // remove extra new line added by writable stream
      }

      accumulatedOutput += text
    },
  })

  // This code is the same idea as exec.ts in decaf.
  // Using 'sh -c' allows us to run complex commands that contain &&, |, >, etc.
  const { code } = await spawn(
    ["sh", "-c", runScriptShellCommand],
    env,
    undefined, // cwd
    {
      stdin: null,
      stdout: stdoutStream,
      stderr: stderrStream,
    },
  )
  let stdout = accumulatedOutput.split("\n")

  const outputFileContentsAfterRun = await readFile(inputFilePath, "utf-8")
  let output: TOutput | null = null
  if (outputFileContentsAfterRun !== inputFileContentsBeforeRun) {
    output = JSON.parse(outputFileContentsAfterRun) as TOutput
  }

  if (removeAnsiCodes) {
    stdout = stdout.map((line) => stripAnsi(line))
  }

  // Trim possible trailing empty line from stdout for convenience.
  // otherwise, you will likely need to: assertEquals(getLatest.stdout, ["hello", ""]) in every test. I did it. it's annoying.
  if (stdout.length > 0 && stdout[stdout.length - 1].trim() === "") {
    stdout.pop()
  }

  return { code, output, stdout }
}
