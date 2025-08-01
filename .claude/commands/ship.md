# ship

Stages all changes and then combines /commit and /push commands to ship changes in one step.

## Usage

```
/ship "Your commit message"
```

## Description

This command runs:

1. `/stage` - Stages all changes (tracked and untracked)
2. `/commit "Your commit message"` - Tests changed files, formats, lints, and commits staged changes
3. `/push` - Runs all tests and pushes commits to the remote repository

## Example

```
/ship "fix: Resolve TypeScript errors in state manager"
```

## Implementation

This command executes:

```
/stage
/commit "{message}"
/push
```

## Prerequisites

- The `/stage` command will automatically stage all changes
- The `/commit` command will handle testing changed files, formatting and linting
- The `/push` command will handle running all tests, pulling and pushing

## Notes

- If commit fails (due to test failures, lint errors, etc.), push will not execute
- If push tests fail, the push will be aborted
- Uses the same formatting and linting rules as `/commit`
- Pushes to the current branch by default
