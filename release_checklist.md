Release checklist
=================
1. Run tests
2. Update version in package.json as well as in package-lock.json (by running npm install)
3. Update version in CHANGELOG
4. Run build CI
5. Create a git Release+tag (both title and tag are vA.B.C, description is CHANGELOG content)
6. Run `npm run build` & `npm run build:dev:ci`
7. Run `npm publish` (push the package to npm)

CHANGELOG types of changes
==========================
`Added`      for new features.
`Changed`    for changes in existing functionality.
`Deprecated` for soon-to-be removed features.
`Removed`    for now removed features.
`Fixed`      for any bug fixes.
`Security`   for vulnerabilities.
