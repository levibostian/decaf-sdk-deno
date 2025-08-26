import { getEnv } from "@cross/env"
/*
 * File system code
 * 
 * Be able to read and write files for Deno, Bun, and node. 
 * Got this code from: https://github.com/cross-org/fs but the code
 * is so small in size, not worth importing.
 */
import { readFileSync as nodeReadFileSync, writeFileSync as nodeWriteFileSync } from "node:fs"

/**
 * Represents a Git commit with all its metadata and statistics.
 *
 * This interface provides a comprehensive view of a Git commit including
 * author information, file changes, statistics, and branch/tag associations.
 */
export interface GitCommit {
  /** The commit title/subject line (first line of commit message) */
  title: string
  /** The full SHA hash of the commit */
  sha: string
  /** The abbreviated SHA hash (first 8 characters) for display purposes */
  abbreviatedSha: string
  /** The complete commit message body */
  message: string
  /** The commit message split into individual lines */
  messageLines: string[]
  /** Information about the commit author */
  author: {
    /** The author's display name */
    name: string
    /** The author's email address */
    email: string
  }
  /** Information about the commit committer (may differ from author) */
  committer: {
    /** The committer's display name */
    name: string
    /** The committer's email address */
    email: string
  }
  /** The timestamp when the commit was created */
  date: Date
  /** Array of file paths that were modified in this commit */
  filesChanged: string[]
  /** Whether this commit is a merge commit (has multiple parents) */
  isMergeCommit: boolean
  /** Whether this commit is a revert commit (title starts with "Revert") */
  isRevertCommit: boolean
  /** Array of parent commit SHA hashes */
  parents: string[]
  /**
   * The branch this commit belongs to (extracted from refs using two-tier selection).
   * Prefers local branches (e.g., "main", "feature-auth") over remote branches
   * (e.g., "origin/main", "upstream/develop"). If no local branches are found,
   * falls back to remote branches. Excludes tags and HEAD references.
   * May be undefined if no suitable branch reference is found.
   */
  branch?: string
  /** Array of git tags associated with this commit */
  tags?: string[]
  /** Array of all git references (branches, tags, HEAD) for this commit */
  refs?: string[]
  /** Summary statistics of line changes in this commit */
  stats?: {
    /** Total number of lines added */
    additions: number
    /** Total number of lines deleted */
    deletions: number
    /** Total number of lines changed (additions + deletions) */
    total: number
  }
  /** Per-file statistics of changes in this commit */
  fileStats?: Array<{
    /** The file path that was modified */
    filename: string
    /** Number of lines added in this file (tip: binary files may show 0 additions) */
    additions: number
    /** Number of lines deleted in this file (tip: binary files may show 0 deletions) */
    deletions: number
  }>
}

/**
 * Output interface for the get latest release step.
 *
 * Contains the version name and commit SHA of the latest release found.
 */
export interface GetLatestReleaseStepOutput {
  /** The version name of the latest release (e.g., "1.2.3", "v2.0.0") */
  versionName: string
  /** The full SHA hash of the commit associated with the latest release */
  commitSha: string
}

/**
 * Input interface for the get latest release step.
 *
 * Provides all the necessary Git information and configuration needed
 * to determine the latest release in a repository.
 */
export interface GetLatestReleaseStepInput {
  /** The name of the current Git branch being processed */
  gitCurrentBranch: string
  /** The owner/organization name of the Git repository */
  gitRepoOwner: string
  /** The name of the Git repository */
  gitRepoName: string
  /** Whether the step is running in test mode (affects behavior) */
  testMode: boolean
  /** Array of all commits in the current branch */
  gitCommitsCurrentBranch: GitCommit[]
  /** Object mapping branch names to their respective commit arrays */
  gitCommitsAllLocalBranches: { [branchName: string]: GitCommit[] }
}

/**
 * Input interface for the get next release version step.
 *
 * Extends {@link GetLatestReleaseStepInput} with additional information about
 * the last release and commits since that release.
 */
export interface GetNextReleaseVersionStepInput extends GetLatestReleaseStepInput {
  /** The latest release information, or null if no previous release exists */
  lastRelease: GetLatestReleaseStepOutput | null
  /** Array of commits that have been made since the last release */
  gitCommitsSinceLastRelease: GitCommit[]
}

/**
 * Output interface for the get next release version step.
 *
 * Contains the calculated version string for the next release.
 */
export interface GetNextReleaseVersionStepOutput {
  /** The calculated version string for the next release (e.g., "1.3.0", "v2.1.0") */
  version: string
}

/**
 * Input interface for the deploy step.
 *
 * Extends {@link GetNextReleaseVersionStepInput} with the calculated next version name
 * that should be used for deployment.
 */
export interface DeployStepInput extends GetNextReleaseVersionStepInput {
  /** The version name that will be used for the next release deployment */
  nextVersionName: string
}

// ============================================================================
// Main application code
// ============================================================================

/**
 * Gets the input data for a "get latest release" step.
 *
 * This function is used in decaf step scripts that need to
 * determine the latest release in a repository.
 *
 * @returns The parsed input data containing Git repository information and commit history
 *
 * @example
 * ```ts
 * const input = getLatestReleaseStepInput();
 * console.log(`Processing repository: ${input.gitRepoOwner}/${input.gitRepoName}`);
 * console.log(`Current branch: ${input.gitCurrentBranch}`);
 * ```
 */
export const getLatestReleaseStepInput = (): GetLatestReleaseStepInput => {
  return getInput<GetLatestReleaseStepInput>()
}

/**
 * Gets the input data for a "get next release version" step.
 *
 * This function provides information about the repository state
 * and the last release, which is needed to calculate the next version number.
 *
 * @returns The parsed input data including last release info and commits since last release
 *
 * @example
 * ```ts
 * const input = getNextReleaseVersionStepInput();
 * if (input.lastRelease) {
 *   console.log(`Last release: ${input.lastRelease.versionName}`);
 * } else {
 *   console.log("No previous release found");
 * }
 * ```
 */
export const getNextReleaseVersionStepInput = (): GetNextReleaseVersionStepInput => {
  return getInput<GetNextReleaseVersionStepInput>()
}

/**
 * Gets the input data for a "deploy" step.
 *
 * This function provides all the information needed to
 * perform a deployment, including the calculated next version name.
 *
 * @returns The parsed input data containing deployment information and version details
 *
 * @example
 * ```ts
 * const input = getDeployStepInput();
 * if (input.testMode) {
 *   console.log("Running in test mode");
 * }
 * console.log(`Deploying version: ${input.nextVersionName}`);
 * console.log(`Repository: ${input.gitRepoOwner}/${input.gitRepoName}`);
 * ```
 */
export const getDeployStepInput = (): DeployStepInput => {
  return getInput<DeployStepInput>()
}

const getInput = <T>(): T => {
  const filePath = getEnv("DATA_FILE_PATH")
  if (!filePath) throw new Error("DATA_FILE_PATH environment variable is not set.")
  const fileContents = nodeReadFileSync(filePath, "utf-8")
  return JSON.parse(fileContents)
}

/**
 * Sets the output data for a "get latest release" step.
 *
 * This function should be called at the end of a step script to provide results back to decaf.
 *
 * @param output The output data containing version name and commit SHA
 *
 * @example
 * ```ts
 * setLatestReleaseStepOutput({
 *   versionName: "1.2.3",
 *   commitSha: "abc123def456789"
 * });
 * ```
 */
export const setLatestReleaseStepOutput = (output: GetLatestReleaseStepOutput): void => {
  setOutput(output)
}

/**
 * Sets the output data for a "get next release version" step.
 *
 * This function should be called at the end of a step script to provide the calculated
 * next version back to decaf.
 *
 * @param output The output data containing the calculated next version
 *
 * @example
 * ```ts
 * setNextReleaseVersionStepOutput({
 *   version: "2.0.0"
 * });
 * ```
 */
export const setNextReleaseVersionStepOutput = (output: GetNextReleaseVersionStepOutput): void => {
  setOutput(output)
}

const setOutput = (output: GetLatestReleaseStepOutput | GetNextReleaseVersionStepOutput): void => {
  const filePath = getEnv("DATA_FILE_PATH")
  if (!filePath) throw new Error("DATA_FILE_PATH environment variable is not set.")
  nodeWriteFileSync(filePath, JSON.stringify(output))
}
