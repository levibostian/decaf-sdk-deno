# decaf SDK for Deno, Bun & node 

A simple SDK for building [decaf](https://github.com/levibostian/decaf/) step scripts with ease. This SDK provides convenient functions to get input data and set output data for different types of deployment pipeline steps.

# Getting started 

## Install 

This SDK is [hosted on jsr](https://jsr.io/@levibostian/decaf-sdk). On [this webpage](https://jsr.io/@levibostian/decaf-sdk), you will see a "Use with" dropdown that guides you through how to install for node, Deno, and Bun.

## Call input & output functions 

In your step script, you can call the appropriate input and output functions as needed.

For example, in a get latest release step script: 

```ts
const input = getLatestReleaseStepInput();

// input contains all input data passed in from decaf. 

// ... your script logic here...

// When you're done, set the step output: 
setLatestReleaseStepOutput({
  versionName: "1.2.3",
  commitSha: "abc123def456"
});
```

### Available Functions

The SDK exports the following functions:

- `getLatestReleaseStepInput()` - Get input data for latest release steps
- `setLatestReleaseStepOutput()` - Set output data for latest release steps
- `getNextReleaseVersionStepInput()` - Get input data for next release version steps
- `setNextReleaseVersionStepOutput()` - Set output data for next release version steps
- `getDeployStepInput()` - Get input data for deploy steps
- ~~`setDeployStepOutput()`~~ - Note: decaf does not support setting output for deploy step

## Testing Your Scripts

The SDK provides a testing module to help you write tests for your decaf scripts. This module allows you to run your scripts in a test environment and verify their behavior. All of the `runStep()` functions will run your script in a temporary environment, passing in the provided input data and capturing the output.

### Example test

This example uses Deno as the test runner, but you can use any test runner you prefer.

```ts
import { assertEquals } from "jsr:@std/assert";
import { runGetLatestReleaseScript } from "jsr:@levibostian/decaf-sdk/testing";

Deno.test("get latest release script returns expected output", async () => {
  const { code, output, stdout } = await runGetLatestReleaseScript(
    "deno run --allow-env --allow-read --allow-write my-script.ts",
    {
      gitCurrentBranch: "main",
      gitRepoOwner: "username",
      gitRepoName: "repo-name",
      testMode: true,
      gitCommitsCurrentBranch: [],
      gitCommitsAllLocalBranches: {},
    }
  );

  assertEquals(code, 0);
  assertEquals(output?.versionName, "1.2.3");
});
```

The test runner functions return:
- `code` - The exit code from your script
- `output` - The output that your script created and sent back to decaf
- `stdout` - Script console output 

### Available test runner functions

The testing module exports the following functions:
- `runGetLatestReleaseScript(command: string, input: GetLatestReleaseStepInput, options?: RunScriptOptions)` - Run a get latest release step script with the provided command and input data.
- `runGetNextReleaseVersionScript(command: string, input: GetNextReleaseVersionStepInput, options?: RunScriptOptions)` - Run a get next release version step script with the provided command and input data.
- `runDeployScript(command: string, input: DeployStepInput, options?: RunScriptOptions)` - Run a deploy step script with the provided command and input data.

### RunScriptOptions

The `RunScriptOptions` interface allows you to customize the behavior of the test runner functions. It includes the following properties:
- `removeAnsiCodes?: boolean` - If true, ANSI codes will be removed from the script output. Default is true. This makes assertions/snapshot tests more human readable.
- `displayStdout?: boolean` - If true, the script's stdout will be displayed in the console during the test run. Default is true.
- `extraEnvVariables?: Record<string, string>` - Additional environment variables to pass to the script during execution. 
- `currentWorkingDirectory?: string` - The current working directory to run the script in. This is intended to match the behavior of `current_working_directory` config option added in decaf 0.11.0


