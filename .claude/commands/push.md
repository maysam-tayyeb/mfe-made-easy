# push

Safely pushes commits to the remote repository.

## Usage

```
/push [branch-name]
```

If no branch name is provided, pushes to the current branch.

## Steps

1. Check for uncommitted changes
2. Run all tests to ensure code health
3. Pull latest changes with rebase
4. Push to remote repository
5. Show push summary

## Example

```
/push
/push main
/push feature/new-feature
```

## Implementation

```bash
# Get current branch if not specified
BRANCH=${1:-$(git rev-parse --abbrev-ref HEAD)}

# Check for uncommitted changes
git diff --quiet && git diff --cached --quiet || { echo "Uncommitted changes detected"; exit 1; }

# Run all tests to ensure code health
echo "Running all tests before push..."
pnpm test || { echo "Tests failed! Push aborted."; exit 1; }

# Pull latest with rebase
git pull --rebase origin $BRANCH

# Push to remote
git push origin $BRANCH

# Show what was pushed
git log --oneline origin/$BRANCH..$BRANCH
```
