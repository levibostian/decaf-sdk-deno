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

## Available Functions

The SDK exports the following functions:

- `getLatestReleaseStepInput()` - Get input data for latest release steps
- `setLatestReleaseStepOutput()` - Set output data for latest release steps
- `getNextReleaseVersionStepInput()` - Get input data for next release version steps
- `setNextReleaseVersionStepOutput()` - Set output data for next release version steps
- `getDeployStepInput()` - Get input data for deploy steps
- ~~`setDeployStepOutput()`~~ - Note: decaf does not support setting output for deploy step
