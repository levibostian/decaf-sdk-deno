// deno-lint-ignore-file no-import-prefix
import { assertEquals, assertThrows } from "jsr:@std/assert@1.0.16"
import {
  type DeployStepInput,
  getDeployStepInput,
  type GetLatestReleaseStepInput,
  getLatestReleaseStepInput,
  type GetLatestReleaseStepOutput,
  type GetNextReleaseVersionStepInput,
  getNextReleaseVersionStepInput,
  type GetNextReleaseVersionStepOutput,
  type GitCommit,
  setLatestReleaseStepOutput,
  setNextReleaseVersionStepOutput,
} from "./main.ts"

// Test data setup
const mockGitCommit: GitCommit = {
  title: "feat: add new feature",
  sha: "abc123def456789",
  abbreviatedSha: "abc123de",
  message: "feat: add new feature\n\nThis is a test commit message",
  messageLines: ["feat: add new feature", "", "This is a test commit message"],
  author: {
    name: "Test Author",
    email: "test@example.com",
  },
  committer: {
    name: "Test Committer",
    email: "committer@example.com",
  },
  date: new Date("2025-08-21T12:00:00Z"),
  filesChanged: ["src/feature.ts", "README.md"],
  isMergeCommit: false,
  isRevertCommit: false,
  parents: ["parent123"],
  branch: "main",
  tags: ["v1.0.0"],
  refs: ["refs/heads/main", "refs/tags/v1.0.0"],
  stats: {
    additions: 10,
    deletions: 2,
    total: 12,
  },
  fileStats: [
    { filename: "src/feature.ts", additions: 8, deletions: 1 },
    { filename: "README.md", additions: 2, deletions: 1 },
  ],
}

const mockLatestReleaseInput: GetLatestReleaseStepInput = {
  gitCurrentBranch: "main",
  gitRepoOwner: "testowner",
  gitRepoName: "testrepo",
  testMode: false,
  gitCommitsCurrentBranch: [mockGitCommit],
  gitCommitsAllLocalBranches: {
    main: [mockGitCommit],
    develop: [],
  },
}

const mockNextReleaseInput: GetNextReleaseVersionStepInput = {
  ...mockLatestReleaseInput,
  lastRelease: {
    versionName: "1.0.0",
    commitSha: "prev123",
  },
  gitCommitsSinceLastRelease: [mockGitCommit],
}

const mockDeployInput: DeployStepInput = {
  ...mockNextReleaseInput,
  nextVersionName: "1.1.0",
}

// Helper function to set up a temporary test environment
function setupTestEnvironment() {
  const originalDataFilePath = Deno.env.get("DECAF_COMM_FILE_PATH")
  const tempDataFilePath = `/tmp/decaf-test-${Date.now()}-${Math.random().toString(36).substring(7)}.json`
  Deno.env.set("DECAF_COMM_FILE_PATH", tempDataFilePath)

  return {
    originalDataFilePath,
    tempDataFilePath,
    cleanup: () => {
      try {
        Deno.removeSync(tempDataFilePath)
      } catch {
        // File might not exist, ignore error
      }

      Deno.env.delete("DATA_FILE_PATH")
      Deno.env.delete("DECAF_COMM_FILE_PATH")
    },
  }
}

// Tests for getLatestReleaseStepInput()

Deno.test("getLatestReleaseStepInput() - should read and parse JSON data from file", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    Deno.writeTextFileSync(testEnv.tempDataFilePath, JSON.stringify(mockLatestReleaseInput))

    // Act
    const result = getLatestReleaseStepInput()

    // Assert
    assertEquals(result.gitCurrentBranch, "main")
    assertEquals(result.gitRepoOwner, "testowner")
    assertEquals(result.gitRepoName, "testrepo")
    assertEquals(result.testMode, false)
    assertEquals(result.gitCommitsCurrentBranch.length, 1)
    assertEquals(result.gitCommitsCurrentBranch[0].title, "feat: add new feature")
    assertEquals(result.gitCommitsAllLocalBranches.main.length, 1)
  } finally {
    testEnv.cleanup()
  }
})

Deno.test("getLatestReleaseStepInput() - should throw error when file does not exist", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    Deno.env.set("DECAF_COMM_FILE_PATH", "/nonexistent/path.json")

    // Act & Assert
    assertThrows(
      () => getLatestReleaseStepInput(),
      Error,
    )
  } finally {
    testEnv.cleanup()
  }
})

// Tests for getNextReleaseVersionStepInput()

Deno.test("getNextReleaseVersionStepInput() - should read and parse JSON data from file", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    Deno.writeTextFileSync(testEnv.tempDataFilePath, JSON.stringify(mockNextReleaseInput))

    // Act
    const result = getNextReleaseVersionStepInput()

    // Assert
    assertEquals(result.gitCurrentBranch, "main")
    assertEquals(result.gitRepoOwner, "testowner")
    assertEquals(result.gitRepoName, "testrepo")
    assertEquals(result.testMode, false)
    assertEquals(result.lastRelease?.versionName, "1.0.0")
    assertEquals(result.lastRelease?.commitSha, "prev123")
    assertEquals(result.gitCommitsSinceLastRelease.length, 1)
    assertEquals(result.gitCommitsSinceLastRelease[0].title, "feat: add new feature")
  } finally {
    testEnv.cleanup()
  }
})

Deno.test("getNextReleaseVersionStepInput() - should handle null lastRelease", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    const inputWithNullRelease = { ...mockNextReleaseInput, lastRelease: null }
    Deno.writeTextFileSync(testEnv.tempDataFilePath, JSON.stringify(inputWithNullRelease))

    // Act
    const result = getNextReleaseVersionStepInput()

    // Assert
    assertEquals(result.lastRelease, null)
    assertEquals(result.gitCommitsSinceLastRelease.length, 1)
  } finally {
    testEnv.cleanup()
  }
})

// Tests for getDeployStepInput()

Deno.test("getDeployStepInput() - should read and parse JSON data from file", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    Deno.writeTextFileSync(testEnv.tempDataFilePath, JSON.stringify(mockDeployInput))

    // Act
    const result = getDeployStepInput()

    // Assert
    assertEquals(result.gitCurrentBranch, "main")
    assertEquals(result.gitRepoOwner, "testowner")
    assertEquals(result.gitRepoName, "testrepo")
    assertEquals(result.testMode, false)
    assertEquals(result.lastRelease?.versionName, "1.0.0")
    assertEquals(result.nextVersionName, "1.1.0")
    assertEquals(result.gitCommitsSinceLastRelease.length, 1)
  } finally {
    testEnv.cleanup()
  }
})

// Tests for setLatestReleaseStepOutput()

Deno.test("setLatestReleaseStepOutput() - should write JSON data to file", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    const output: GetLatestReleaseStepOutput = {
      versionName: "2.0.0",
      commitSha: "def456abc789",
    }

    // Act
    setLatestReleaseStepOutput(output)

    // Assert
    const fileContents = Deno.readTextFileSync(testEnv.tempDataFilePath)
    const parsedOutput = JSON.parse(fileContents)
    assertEquals(parsedOutput.versionName, "2.0.0")
    assertEquals(parsedOutput.commitSha, "def456abc789")
  } finally {
    testEnv.cleanup()
  }
})

Deno.test("setLatestReleaseStepOutput() - should overwrite existing file content", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    Deno.writeTextFileSync(testEnv.tempDataFilePath, "existing content")
    const output: GetLatestReleaseStepOutput = {
      versionName: "3.0.0",
      commitSha: "xyz789",
    }

    // Act
    setLatestReleaseStepOutput(output)

    // Assert
    const fileContents = Deno.readTextFileSync(testEnv.tempDataFilePath)
    const parsedOutput = JSON.parse(fileContents)
    assertEquals(parsedOutput.versionName, "3.0.0")
    assertEquals(parsedOutput.commitSha, "xyz789")
  } finally {
    testEnv.cleanup()
  }
})

// Tests for setNextReleaseVersionStepOutput()

Deno.test("setNextReleaseVersionStepOutput() - should write JSON data to file", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    const output: GetNextReleaseVersionStepOutput = {
      version: "2.1.0",
    }

    // Act
    setNextReleaseVersionStepOutput(output)

    // Assert
    const fileContents = Deno.readTextFileSync(testEnv.tempDataFilePath)
    const parsedOutput = JSON.parse(fileContents)
    assertEquals(parsedOutput.version, "2.1.0")
  } finally {
    testEnv.cleanup()
  }
})

Deno.test("setNextReleaseVersionStepOutput() - should overwrite existing file content", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    Deno.writeTextFileSync(testEnv.tempDataFilePath, '{"oldKey": "oldValue"}')
    const output: GetNextReleaseVersionStepOutput = {
      version: "3.2.1",
    }

    // Act
    setNextReleaseVersionStepOutput(output)

    // Assert
    const fileContents = Deno.readTextFileSync(testEnv.tempDataFilePath)
    const parsedOutput = JSON.parse(fileContents)
    assertEquals(parsedOutput.version, "3.2.1")
    assertEquals(parsedOutput.oldKey, undefined)
  } finally {
    testEnv.cleanup()
  }
})

// Backward compatibility tests for DATA_FILE_PATH

Deno.test("getLatestReleaseStepInput() - should work with DATA_FILE_PATH for backward compatibility", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    Deno.env.delete("DECAF_COMM_FILE_PATH")
    Deno.env.set("DATA_FILE_PATH", testEnv.tempDataFilePath)
    Deno.writeTextFileSync(testEnv.tempDataFilePath, JSON.stringify(mockLatestReleaseInput))

    // Act
    const result = getLatestReleaseStepInput()

    // Assert
    assertEquals(result.gitCurrentBranch, "main")
    assertEquals(result.gitRepoOwner, "testowner")
    assertEquals(result.gitRepoName, "testrepo")
  } finally {
    testEnv.cleanup()
  }
})

Deno.test("getNextReleaseVersionStepInput() - should work with DATA_FILE_PATH for backward compatibility", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    Deno.env.delete("DECAF_COMM_FILE_PATH")
    Deno.env.set("DATA_FILE_PATH", testEnv.tempDataFilePath)
    Deno.writeTextFileSync(testEnv.tempDataFilePath, JSON.stringify(mockNextReleaseInput))

    // Act
    const result = getNextReleaseVersionStepInput()

    // Assert
    assertEquals(result.gitCurrentBranch, "main")
    assertEquals(result.lastRelease?.versionName, "1.0.0")
  } finally {
    testEnv.cleanup()
  }
})

Deno.test("getDeployStepInput() - should work with DATA_FILE_PATH for backward compatibility", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    Deno.env.delete("DECAF_COMM_FILE_PATH")
    Deno.env.set("DATA_FILE_PATH", testEnv.tempDataFilePath)
    Deno.writeTextFileSync(testEnv.tempDataFilePath, JSON.stringify(mockDeployInput))

    // Act
    const result = getDeployStepInput()

    // Assert
    assertEquals(result.gitCurrentBranch, "main")
    assertEquals(result.nextVersionName, "1.1.0")
  } finally {
    testEnv.cleanup()
  }
})

Deno.test("setLatestReleaseStepOutput() - should work with DATA_FILE_PATH for backward compatibility", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    Deno.env.delete("DECAF_COMM_FILE_PATH")
    Deno.env.set("DATA_FILE_PATH", testEnv.tempDataFilePath)
    const output: GetLatestReleaseStepOutput = {
      versionName: "2.0.0",
      commitSha: "def456abc789",
    }

    // Act
    setLatestReleaseStepOutput(output)

    // Assert
    const fileContents = Deno.readTextFileSync(testEnv.tempDataFilePath)
    const parsedOutput = JSON.parse(fileContents)
    assertEquals(parsedOutput.versionName, "2.0.0")
    assertEquals(parsedOutput.commitSha, "def456abc789")
  } finally {
    testEnv.cleanup()
  }
})

Deno.test("setNextReleaseVersionStepOutput() - should work with DATA_FILE_PATH for backward compatibility", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    Deno.env.delete("DECAF_COMM_FILE_PATH")
    Deno.env.set("DATA_FILE_PATH", testEnv.tempDataFilePath)
    const output: GetNextReleaseVersionStepOutput = {
      version: "2.1.0",
    }

    // Act
    setNextReleaseVersionStepOutput(output)

    // Assert
    const fileContents = Deno.readTextFileSync(testEnv.tempDataFilePath)
    const parsedOutput = JSON.parse(fileContents)
    assertEquals(parsedOutput.version, "2.1.0")
  } finally {
    testEnv.cleanup()
  }
})

Deno.test("DECAF_COMM_FILE_PATH takes precedence over DATA_FILE_PATH", () => {
  const testEnv = setupTestEnvironment()

  try {
    // Arrange
    const tempDataFilePath2 = `/tmp/decaf-test-${Date.now()}-${Math.random().toString(36).substring(7)}-2.json`
    Deno.env.set("DECAF_COMM_FILE_PATH", testEnv.tempDataFilePath)
    Deno.env.set("DATA_FILE_PATH", tempDataFilePath2)

    const input1 = { ...mockLatestReleaseInput, gitRepoOwner: "from-decaf-comm-file" }
    const input2 = { ...mockLatestReleaseInput, gitRepoOwner: "from-data-file" }

    Deno.writeTextFileSync(testEnv.tempDataFilePath, JSON.stringify(input1))
    Deno.writeTextFileSync(tempDataFilePath2, JSON.stringify(input2))

    // Act
    const result = getLatestReleaseStepInput()

    // Assert
    assertEquals(result.gitRepoOwner, "from-decaf-comm-file")

    // Cleanup
    try {
      Deno.removeSync(tempDataFilePath2)
    } catch {
      // ignore
    }
  } finally {
    testEnv.cleanup()
  }
})
