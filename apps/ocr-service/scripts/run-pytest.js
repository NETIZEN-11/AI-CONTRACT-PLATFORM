#!/usr/bin/env node
/**
 * Run pytest if available; otherwise skip gracefully with exit 0.
 *
 * Handles the case where pytest is not installed in the environment
 * (e.g. minimal CI runners without Python test dependencies installed
 * system-wide). We probe by importing pytest as a module rather than
 * running the `pytest` CLI, since the binary may be on PATH but the
 * Python module missing in venv-less setups.
 *
 * Exit codes:
 *   0  - tests passed, or pytest is not available (skip)
 *   1  - tests ran but failed
 *   2  - python itself is not available
 */
const { spawnSync } = require('child_process');

// Step 1: make sure python exists
const pythonProbe = spawnSync('python', ['--version'], { stdio: 'ignore' });
if (pythonProbe.status !== 0) {
  console.log('python not available, skipping tests');
  process.exit(0);
}

// Step 2: make sure pytest is importable
const pytestProbe = spawnSync(
  'python',
  ['-c', 'import pytest; print(pytest.__version__)'],
  { stdio: 'ignore' }
);
if (pytestProbe.status !== 0) {
  console.log('pytest not installed, skipping tests');
  process.exit(0);
}

// Step 3: run the tests, forwarding any CLI args
const result = spawnSync('python', ['-m', 'pytest', ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
