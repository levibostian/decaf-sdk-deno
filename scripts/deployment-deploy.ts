#!/usr/bin/env -S deno run --quiet --allow-all --no-lock

import $ from "jsr:@david/dax"
import { getDeployStepInput } from "../main.ts"

const input = getDeployStepInput()

// Deno publish

const argsToDenoPublish = [
  "publish",
  "--set-version",
  input.nextVersionName,
  "--allow-dirty",
]

if (input.testMode) {
  argsToDenoPublish.push("--dry-run")
}

// https://github.com/dsherret/dax#providing-arguments-to-a-command
await $`deno ${argsToDenoPublish}`.printCommand()

// GitHub Release

const argsToCreateGithubRelease = [
  `release`,
  `create`,
  input.nextVersionName,
  `--generate-notes`,
  `--latest`,
  `--target`,
  "main",
]

if (input.testMode) {
  console.log("Running in test mode, skipping creating GitHub release.")
  console.log(`Command to create GitHub release: gh ${argsToCreateGithubRelease.join(" ")}`)

  Deno.exit(0)
}

await $`gh ${argsToCreateGithubRelease}`.printCommand()
