# AGENTS.md

Guidance for AI coding agents working with `@nexdom/pkg-template`.

> [!Note]
> This repository is a **GitHub template** for NEXDOM Node.js libraries, currently shipping only a placeholder `sayHello()` export. If this repo was created _from_ the template (i.e. it's no longer `pkg-template` itself, but a real library built on top of it), revisit the ["Using this library"](#using-this-library) section below and rewrite it to describe the actual public API — it currently reflects the template's placeholder state, not a finished library.

## Project summary

- A Vite+ (`vite-plus`) and TypeScript template for publishing Node.js libraries to NPM and GitHub Pages (via Vitepress docs).
- Public API is exported from [src/index.ts](src/index.ts) and built to `dist/index.mjs`.
- Package is currently `"private": true` (not published). Publishing to NPM requires removing that flag and configuring an `npmToken` secret — see [README.md](README.md).

---

## Using this library

For agents helping a developer _consume_ `@nexdom/pkg-template` in their own project (not editing this repo).

- Install with the project's package manager, or with Vite+ if available:

  ```bash
  vp add @nexdom/pkg-template
  # or
  npm i @nexdom/pkg-template
  # or
  pnpm add @nexdom/pkg-template
  # or
  yarn add @nexdom/pkg-template
  ```

- It's an ESM-only package (`"type": "module"`), single entry point:

  ```ts
  import { sayHello } from "@nexdom/pkg-template";
  ```

- Full API reference and guides are published at https://nexdom-healthtech.github.io/pkg-template/ — check the [docs/api](docs/api) folder in this repo for the source of that content, since it's more likely to be current than a cached web page.
- Do not import from `src/` or `dist/` internals directly; only the paths declared in `package.json#exports` (currently just the package root) are supported.

---

## Contributing to this library

For agents making changes inside this repo.

### Environment

- Development is expected to happen inside the provided **devcontainer** ([.devcontainer/devcontainer.json](.devcontainer/devcontainer.json)). If working outside it, ensure Node.js ≥ 20 and the [Vite+](https://vite-plus.dev) toolchain are available.
- Install dependencies with `vp install`. If commands like `vpr`/`vpx` are missing, run `vp env setup`; use `vp env doctor` to diagnose environment issues.

### Everyday commands

| Purpose                         | Command                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Install deps                    | `vp install`                                                                                                   |
| Lint, format, type-check        | `vp check` (also runs `--fix` automatically on staged files via `vite.config.ts`)                              |
| Unit tests                      | `vp test` (add `--coverage` for coverage; global threshold is 95% lines, see [vite.config.ts](vite.config.ts)) |
| Mutation tests                  | `vpr test:mutations` (Stryker; break threshold 90%, see [stryker.config.json](stryker.config.json))            |
| Architecture / dependency rules | `vpr depcruise` (see [.dependency-cruiser.cjs](.dependency-cruiser.cjs))                                       |
| Build the library               | `vpr build` / `vp run build`                                                                                   |
| Docs dev server                 | `vpr docs` / `vp run docs`                                                                                     |
| Build docs                      | `vpr docs:build`                                                                                               |

Run `vp check`, `vp test --coverage`, and `vpr depcruise` locally before considering a change done — CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs all of these plus commitlint, mutation testing, and SonarQube on every PR.

### Code conventions

- All published code lives in [src/](src/) and must be written in **English**.
- Public methods/attributes should have **JSDoc** comments (markdown is supported inside them, including code examples) — this is the library's primary documentation mechanism.
- Tests live under `src/__tests__/` using `vite-plus/test` (a Vitest-based runner with `jsdom`); import source via the `@/` path alias (e.g. `@/index.ts`), not relative paths.
- Formatting/linting is handled by `oxc` (config in [vite.config.ts](vite.config.ts)); don't hand-format against its output.

### Docs conventions

- [docs/](docs/) is a Vitepress site. Unlike `src/`, **docs content must be written in Portuguese** (`pt-BR`) — the docs are aimed at Brazilian users even though the code and code comments are in English.
- New/changed public APIs should get a corresponding page under [docs/api/](docs/api/).

### Commits & branching

- Commit messages must follow **Conventional Commits** (enforced by commitlint in CI, `@commitlint/config-conventional`).
- This project uses **trunk-based development**: `main` is the only permanent branch (protected, no direct pushes). Short-lived branches are created from `main` and merged back via PR, then deleted.
- Only use `beta` or `alpha` branches for genuinely unstable/pre-release work or unsettled API signatures — see [CONTRIBUTING.md](CONTRIBUTING.md#when-to-use-beta) for the full flow. Default to branching from and targeting `main`.
- Versioning and releases (via `semantic-release`, config in [package.json](package.json)) are fully automated from commit messages — never hand-edit version numbers or changelogs.

### Pull requests

- Open PRs against `main` (or `beta`/`alpha` per the branching rules above), never push directly to protected branches.
- Follow [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md): describe _what_ the PR solves (or link the issue), and include tests that fail without the change and pass with it when possible.
