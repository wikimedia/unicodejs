# Contribute to UnicodeJS

## Release process

1. Create or reset your `release` branch to the latest head of the repository
   ```
   git remote update && git checkout -B release -t origin/HEAD
   ```

2. Ensure build and tests pass locally.
   NOTE: This does not require privileges and should be run in isolation.
   ```
   npm ci && npm test
   ```

3. Prepare the release commit
   - Add release notes to a new section on top of [History.md](./History.md).
     ```
     git log --format='* %s (%aN)' --no-merges --reverse v$(node -e 'console.log(require("./package.json").version);')...HEAD | sort | grep -vE '^\* (build|docs?|tests?):'
     ```
   - Set the next release version in [package.json](./package.json).
   - Review and stage your commit:
     ```
     git add -p
     ```
   - Save your commit and push for review.
     ```
     git commit -m "Tag vX.Y.Z"
     git review
     ```

After the release commit has been merged by CI, perform the actual release:

1. Update and reset your `release` branch, confirm it is at your merged commit.
   ```
   git remote update && git checkout -B release -t origin/HEAD
   # …
   git show
   # Tag vX.Y.Z
   # …
   ```

3. Create a signed tag and push it to the Git server:
   ```
   git tag -s "vX.Y.Z"
   git push --tags
   ```

4. Run the build and review the release file (e.g. proper release version header
   in the header, and not a development build).
   NOTE: This does not require privileges and should be run in isolation.
   ```
   npm run build
   # …
   head dist/unicodejs.js
   # UnicodeJS v12.0.0
   # …
   ```

5. Publish to npm:
   ```
   npm publish
   ```