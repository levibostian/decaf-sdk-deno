// a decaf script test runner essentially. Copied from decaf: https://github.com/levibostian/decaf/blob/a0e324f7209c0f37b9d275b7259fcefd591a17c6/steps/get-next-release.test.ts#L4

import type { DeployStepInput, GetLatestReleaseStepInput, GetLatestReleaseStepOutput, GetNextReleaseVersionStepInput, GetNextReleaseVersionStepOutput } from "../main.ts"
import ansiRegex from "ansi-regex"

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
  const tempFile = await Deno.makeTempFile()
  const inputFileContents = JSON.stringify(input)
  await Deno.writeTextFile(tempFile, inputFileContents)
  return tempFile
}

const defaultEnvVariables = {
  INPUT_GITHUB_TOKEN: "abcd1234",
  NO_COLOR: "1", // disable color output (anscii) for easier testing. https://docs.deno.com/api/deno/~/Deno.noColor
  ...Deno.env.toObject(),
}

export async function runScript<TOutput>(
  runScriptShellCommand: string,
  env: Record<string, string>,
): Promise<{ code: number; output: TOutput | null; stdout: string[] }> {
  const inputFilePath = env["DATA_FILE_PATH"]
  if (!inputFilePath) {
    throw new Error("DATA_FILE_PATH environment variable is not set.")
  }

  const inputFileContentsBeforeRun = await Deno.readTextFile(inputFilePath)

  // This code is the same as exec.ts in decaf.
  // using 'sh -c' allows us to run complex commands that contain &&, |, >, etc.
  // without it, commands like `echo "test" >> output.txt` would not work. you could only do simple commands like `echo "test"`.
  const process = new Deno.Command("sh", {
    args: ["-c", runScriptShellCommand],
    stdout: "piped",
    stderr: "piped",
    env,
  })

  const child = process.spawn()

  const combinedOutput: string[] = []

  child.stdout.pipeTo(
    new WritableStream({
      write(chunk) {
        const decodedChunk = new TextDecoder().decode(chunk).trimEnd()

        combinedOutput.push(decodedChunk)
        
          console.log(decodedChunk)
      },
    }),
  )
  child.stderr.pipeTo(
    new WritableStream({
      write(chunk) {
        const decodedChunk = new TextDecoder().decode(chunk).trimEnd()

        combinedOutput.push(decodedChunk)
        
          console.log(decodedChunk)
      },
    }),
  )

  const code = (await child.status).code

  const outputFileContentsAfterRun = await Deno.readTextFile(inputFilePath)
  let output: TOutput | null = null
  if (outputFileContentsAfterRun !== inputFileContentsBeforeRun) {
    output = JSON.parse(outputFileContentsAfterRun) as TOutput
  }

  const combinedOutputWithoutAnsiCodes = combinedOutput.map((line) => line.replace(ansiRegex(), ""))

  return { code, output, stdout: combinedOutputWithoutAnsiCodes }
}

