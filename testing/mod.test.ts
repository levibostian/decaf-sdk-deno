// deno-lint-ignore-file no-import-prefix
import { assertEquals, assertNotEquals, assertRejects } from "jsr:@std/assert@1.0.16"
import { runDeployScript, runGetLatestReleaseScript, runGetNextReleaseVersionScript } from "./mod.ts"

const denoConfigPath = `${Deno.cwd()}/deno.json`
const mainModuleUrl = new URL("../main.ts", import.meta.url).href

const createScript = (scriptContent: string): string => {
  const tempScriptPath = Deno.makeTempFileSync({ suffix: ".ts" })
  Deno.writeTextFileSync(tempScriptPath, scriptContent)
  return tempScriptPath
}

Deno.test("expect scripts able to access custom environment variables", async () => {
  Deno.env.set("CUSTOM_ENV_VAR", "test-value")

  const scriptPath = createScript(`
    console.log(Deno.env.get("CUSTOM_ENV_VAR"));
  `)

  const { stdout: getLatestReleaseScriptOutput } = await runGetLatestReleaseScript("deno run --allow-env " + scriptPath, {
    gitCurrentBranch: "main",
    gitRepoOwner: "your-github-username",
    gitRepoName: "your-repo-name",
    testMode: true,
    gitCommitsCurrentBranch: [],
    gitCommitsAllLocalBranches: {},
  })
  const { stdout: getNextReleaseVersionScriptOutput } = await runGetNextReleaseVersionScript("deno run --allow-env " + scriptPath, {
    gitCurrentBranch: "main",
    gitRepoOwner: "your-github-username",
    gitRepoName: "your-repo-name",
    testMode: true,
    gitCommitsCurrentBranch: [],
    gitCommitsAllLocalBranches: {},
    lastRelease: null,
    gitCommitsSinceLastRelease: [],
  })
  const { stdout: deployScriptOutput } = await runDeployScript("deno run --allow-env " + scriptPath, {
    gitCurrentBranch: "main",
    gitRepoOwner: "your-github-username",
    gitRepoName: "your-repo-name",
    testMode: true,
    gitCommitsCurrentBranch: [],
    gitCommitsAllLocalBranches: {},
    lastRelease: null,
    gitCommitsSinceLastRelease: [],
    nextVersionName: "1.0.0",
  })

  assertEquals(getLatestReleaseScriptOutput, ["test-value"])
  assertEquals(getNextReleaseVersionScriptOutput, ["test-value"])
  assertEquals(deployScriptOutput, ["test-value"])
})

Deno.test("run scripts return code/output/stdout", async () => {
  const getLatestScriptPath = createScript(`
    import { setLatestReleaseStepOutput } from "${mainModuleUrl}";

    console.log("hello");
    setLatestReleaseStepOutput({ versionName: "1.2.3", commitSha: "abc123" });
  `)

  const getLatest = await runGetLatestReleaseScript(
    `deno run -c "${denoConfigPath}" --allow-env --allow-read --allow-write "${getLatestScriptPath}"`,
    {
      gitCurrentBranch: "main",
      gitRepoOwner: "your-github-username",
      gitRepoName: "your-repo-name",
      testMode: true,
      gitCommitsCurrentBranch: [],
      gitCommitsAllLocalBranches: {},
    },
  )

  assertEquals(getLatest.code, 0)
  assertEquals(getLatest.stdout, ["hello"])
  assertEquals(getLatest.output, { versionName: "1.2.3", commitSha: "abc123" })

  const getNextScriptPath = createScript(`
    import { setNextReleaseVersionStepOutput } from "${mainModuleUrl}";

    console.log("hello");
    setNextReleaseVersionStepOutput({ version: "9.9.9" });
  `)

  const getNext = await runGetNextReleaseVersionScript(
    `deno run -c "${denoConfigPath}" --allow-env --allow-read --allow-write "${getNextScriptPath}"`,
    {
      gitCurrentBranch: "main",
      gitRepoOwner: "your-github-username",
      gitRepoName: "your-repo-name",
      testMode: true,
      gitCommitsCurrentBranch: [],
      gitCommitsAllLocalBranches: {},
      lastRelease: null,
      gitCommitsSinceLastRelease: [],
    },
  )

  assertEquals(getNext.code, 0)
  assertEquals(getNext.stdout, ["hello"])
  assertEquals(getNext.output, { version: "9.9.9" })

  const deployScriptPath = createScript(`
    console.log("hello");
  `)

  const deploy = await runDeployScript(
    `deno run -c "${denoConfigPath}" --allow-env --allow-read "${deployScriptPath}"`,
    {
      gitCurrentBranch: "main",
      gitRepoOwner: "your-github-username",
      gitRepoName: "your-repo-name",
      testMode: true,
      gitCommitsCurrentBranch: [],
      gitCommitsAllLocalBranches: {},
      lastRelease: null,
      gitCommitsSinceLastRelease: [],
      nextVersionName: "1.0.0",
    },
  )

  assertEquals(deploy.code, 0)
  assertEquals(deploy.stdout, ["hello"])
})

Deno.test("unable to run shell command exits with non-zero code", async () => {
  const { code } = await runGetLatestReleaseScript("definitely-not-a-real-command-to-run", {
      gitCurrentBranch: "main",
      gitRepoOwner: "your-github-username",
      gitRepoName: "your-repo-name",
      testMode: true,
      gitCommitsCurrentBranch: [],
      gitCommitsAllLocalBranches: {},
    })

  assertNotEquals(code, 0)
})

Deno.test("scripts can read input data from temp file", async () => {
  const getLatestScriptPath = createScript(`
    import { getLatestReleaseStepInput } from "${mainModuleUrl}";

    const input = getLatestReleaseStepInput();
    console.log(input.gitRepoOwner);
  `)

  const { stdout: latestStdout } = await runGetLatestReleaseScript(
    `deno run -c "${denoConfigPath}" --allow-env --allow-read "${getLatestScriptPath}"`,
    {
      gitCurrentBranch: "main",
      gitRepoOwner: "your-github-username",
      gitRepoName: "your-repo-name",
      testMode: true,
      gitCommitsCurrentBranch: [],
      gitCommitsAllLocalBranches: {},
    },
  )
  assertEquals(latestStdout, ["your-github-username"])

  const getNextScriptPath = createScript(`
    import { getNextReleaseVersionStepInput } from "${mainModuleUrl}";

    const input = getNextReleaseVersionStepInput();
    console.log(input.gitRepoOwner);
  `)

  const { stdout: nextStdout } = await runGetNextReleaseVersionScript(
    `deno run -c "${denoConfigPath}" --allow-env --allow-read "${getNextScriptPath}"`,
    {
      gitCurrentBranch: "main",
      gitRepoOwner: "your-github-username",
      gitRepoName: "your-repo-name",
      testMode: true,
      gitCommitsCurrentBranch: [],
      gitCommitsAllLocalBranches: {},
      lastRelease: null,
      gitCommitsSinceLastRelease: [],
    },
  )
  assertEquals(nextStdout, ["your-github-username"])

  const deployScriptPath = createScript(`
    import { getDeployStepInput } from "${mainModuleUrl}";

    const input = getDeployStepInput();
    console.log(input.gitRepoOwner);
  `)

  const { stdout: deployStdout } = await runDeployScript(
    `deno run -c "${denoConfigPath}" --allow-env --allow-read "${deployScriptPath}"`,
    {
      gitCurrentBranch: "main",
      gitRepoOwner: "your-github-username",
      gitRepoName: "your-repo-name",
      testMode: true,
      gitCommitsCurrentBranch: [],
      gitCommitsAllLocalBranches: {},
      lastRelease: null,
      gitCommitsSinceLastRelease: [],
      nextVersionName: "1.0.0",
    },
  )
  assertEquals(deployStdout, ["your-github-username"])
})

Deno.test("stdout returned does not contain ansi codes", async () => {
  const scriptPath = createScript(`
    console.log("\u001b[31mred\u001b[0m");
  `)

  const { stdout } = await runGetLatestReleaseScript(`deno run --allow-env "${scriptPath}"`, {
    gitCurrentBranch: "main",
    gitRepoOwner: "your-github-username",
    gitRepoName: "your-repo-name",
    testMode: true,
    gitCommitsCurrentBranch: [],
    gitCommitsAllLocalBranches: {},
  })

  assertEquals(stdout, ["red"])
})

Deno.test("stdout includes stderr lines", async () => {
  const scriptPath = createScript(`
    // log between stdout and stderr and we assert the order is preserved
    console.log("out");
    console.error("err");
    console.log("out2");
  `)

  const { stdout } = await runGetLatestReleaseScript(`deno run --allow-env "${scriptPath}"`, {
    gitCurrentBranch: "main",
    gitRepoOwner: "your-github-username",
    gitRepoName: "your-repo-name",
    testMode: true,
    gitCommitsCurrentBranch: [],
    gitCommitsAllLocalBranches: {},
  })

  // assert the order of stdout and stderr lines is preserved
  assertEquals(stdout, ["out", "err", "out2"])
})

Deno.test("output is null when script does not write output", async () => {
  const scriptPath = createScript(`
    console.log("no output written");
  `)

  const { output, stdout } = await runGetLatestReleaseScript(`deno run --allow-env "${scriptPath}"`, {
    gitCurrentBranch: "main",
    gitRepoOwner: "your-github-username",
    gitRepoName: "your-repo-name",
    testMode: true,
    gitCommitsCurrentBranch: [],
    gitCommitsAllLocalBranches: {},
  })

  assertEquals(stdout, ["no output written"])
  assertEquals(output, null)
})

Deno.test("non-zero exit code returns the the exit code", async () => {
  const scriptPath = createScript(`
    console.error("exiting with code 2");
    Deno.exit(2);
  `)

   const { code, stdout } = await runGetLatestReleaseScript(`deno run --allow-env "${scriptPath}"`, {
      gitCurrentBranch: "main",
      gitRepoOwner: "your-github-username",
      gitRepoName: "your-repo-name",
      testMode: true,
      gitCommitsCurrentBranch: [],
      gitCommitsAllLocalBranches: {},
    })

    assertEquals(code, 2)
    assertEquals(stdout, ["exiting with code 2"])
})

