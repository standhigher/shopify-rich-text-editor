# Contributing

Thanks for helping improve Shopify Rich Text Editor.

## Development Setup

```bash
pnpm install
pnpm dev
```

## Before Opening a Pull Request

Run the local checks:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
npm run build-storybook
pnpm pack:dry-run
```

## Pull Request Guidelines

- Keep changes focused and easy to review.
- Update README or docs when behavior, setup, or public API changes.
- Add or update tests for server-side behavior changes.
- Preserve Tiptap JSON as the editable source of truth.
- Do not introduce internal credentials, store data, or private URLs.

## Reporting Issues

Use the GitHub issue templates for bugs and feature requests:

- [Bug report](https://github.com/standhigher/shopify-rich-text-editor/issues/new?template=bug_report.yml)
- [Feature request](https://github.com/standhigher/shopify-rich-text-editor/issues/new?template=feature_request.yml)
