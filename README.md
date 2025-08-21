# Decaf SDK for Deno & node 

A simple SDK for building Decaf step scripts with ease. This SDK provides convenient functions to get input data and set output data for different types of deployment pipeline steps.

# Getting started 

## Installation

### Deno

```typescript
import {...} from "jsr:@levibostian/decaf-sdk";
```

### Node.js

```bash
npx jsr add @levibostian/decaf-sdk
```

```typescript
import {...} from "@levibostian/decaf-sdk";
```

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


