# Release Guide

This guide covers preparing and publishing:

- `@standhigher/shopify-rich-text-editor`
- `@standhigher/shopify-rich-text-server`

## Registry

Always publish to the public npmjs registry:

```bash
https://registry.npmjs.org/
```

The package manifests include:

```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

## Authentication

Preferred setup is a granular npm access token with:

- `Read and write`
- package or scope access for `@standhigher`
- bypass two-factor authentication enabled
- no IP restriction unless the publish network is stable

Set the token locally:

```bash
npm config set //registry.npmjs.org/:_authToken=<token>
npm whoami --registry https://registry.npmjs.org/
```

Web Auth is also supported:

```bash
npm login --auth-type=web --registry https://registry.npmjs.org/
```

If the account requires OTP for direct publishing, use the current authenticator code:

```bash
npm publish --access public --registry https://registry.npmjs.org/ --otp <code>
```

## Versioning

Use semantic versioning:

- patch: bug fixes
- minor: backward-compatible features or documentation/release improvements
- major: breaking public API changes

The 1.0 release line uses Node.js `>=22.0.0`, pnpm `10.15.x`, and package
version `1.0.0`. The implementation branch runs every local gate but does not
publish to npm.

```bash
pnpm release:patch
pnpm release:minor
pnpm release:major
```

## Dry Run

Inspect package contents before publishing:

```bash
pnpm pack:dry-run
pnpm pack:check
```

For a package-level npm dry-run:

```bash
cd packages/rich-text-editor
npm pack --dry-run --registry=https://registry.npmjs.org/
```

## Dist Tags

Default publish uses the `latest` dist-tag.

Use a prerelease tag only for preview builds:

```bash
npm publish --access public --tag next --registry https://registry.npmjs.org/
```

Move tags explicitly when needed:

```bash
npm dist-tag add @standhigher/shopify-rich-text-core@0.4.0 latest
npm dist-tag add @standhigher/shopify-rich-text-editor@0.4.0 latest
npm dist-tag add @standhigher/shopify-rich-text-server@0.4.0 latest
```

## Publish

```bash
pnpm release:publish
```

For a 1.0 candidate, publish a prerelease with `--tag next`, verify clean-project
installation and imports, then move `latest` only after the merged main branch
passes `pnpm release:check`. Never publish directly from an unmerged feature
branch.

## Git Tags

After a successful publish:

```bash
git tag v0.4.0
git push origin <branch> --tags
```

## Pre-Publish Checklist

- [ ] Working tree is clean except intended release changes.
- [ ] npm latest versions checked.
- [ ] Versions are bumped in both package manifests.
- [ ] Changelog is updated.
- [ ] README and package README files are updated.
- [ ] `npm run lint` passes.
- [ ] `npm run test` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] `npm run build-storybook` passes.
- [ ] `npm pack --dry-run --registry=https://registry.npmjs.org/` inspected for both published packages.
- [ ] `pnpm pack:check` confirms no tests, fixtures, demos, source, credentials, or Storybook files are included.
- [ ] A clean temporary project imports the Editor root, Editor CSS, Core root, and Server root.
- [ ] Migration failure rollback preserves original JSON and cached HTML.

## Rollback

If a publication or installation check fails, stop the release and leave the
existing `latest` dist-tag unchanged. Fix the candidate and publish a new
prerelease or patch. If a bad version has already been published, move the
dist-tag back to the last verified version and keep all persisted documents and
migration history intact.
