# Changelog

All notable changes to this project are documented here.

This project follows semantic versioning for the published npm packages:

- `@standhigher/shopify-rich-text-editor`
- `@standhigher/shopify-rich-text-server`

## Unreleased - 0.4.x Extension Contract

### Added

- Added the dependency-free `@standhigher/shopify-rich-text-core` package for shared document, error, extension, and migration contracts.
- Added deterministic extension dependency resolution and structured conflict errors.
- Added editor and server Extension Registries with custom serializer support.
- Added pure document migration helpers with missing, duplicate, and cycle detection.

### Changed

- Existing editor usage keeps the default 0.3.x extensions and now accepts optional `extensionContracts`.
- Server validation derives its node and mark allowlist from the registered server extensions.

## 0.3.0 - 2026-08-20

### Added

- Added editor component regression tests with jsdom and Polaris test setup.
- Added `disabled` editor state and structured `RichTextError` upload failures.
- Added server-side validation limits for UTF-8 document bytes, text length, node count, attrs count, and nesting depth.
- Added structured validation errors for unknown nodes, unknown marks, unsafe URLs, and oversized documents.

### Changed

- Pending debounced editor changes are flushed before unmount.
- Server validation supports per-request limit overrides while preserving default limits.

## 0.2.0 - 2026-08-11

### Added

- Expanded npm and GitHub package metadata for public discovery.
- Added English README as the default project entry and Chinese README as a companion document.
- Added npm package README content for the editor and server packages.
- Added release documentation, contribution guide, security policy, code of conduct, GitHub issue templates, pull request template, and CI workflow.
- Added release helper scripts for major, minor, patch, verification, and npm publishing.

### Changed

- Improved package keywords, descriptions, repository links, bug tracker links, author, license, and publish file lists.

## 0.1.0 - 2026-07-30

### Added

- Initial Shopify Rich Text Editor monorepo.
- React editor package with Tiptap 3 and Polaris-aligned toolbar UI.
- Server package for validation, serialization, sanitization, and Shopify-safe HTML output.
- Next.js demo app.
