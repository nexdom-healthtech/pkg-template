# AGENTS.md

Guidance for AI coding agents working with `@nexdom/pkg-template`.

> [!Note]
> This repository is a **GitHub template** for NEXDOM Node.js libraries, currently shipping only a placeholder `sayHello()` export. If this repo was created _from_ the template (i.e. it's no longer `pkg-template` itself, but a real library built on top of it), revisit the ["Using this library"](#using-this-library) section below and rewrite it to describe the actual public API — it currently reflects the template's placeholder state, not a finished library.
>
> Also update the template's references in the AI agent setup: replace the package name (`@nexdom/pkg-template`) and the GitHub repository (`nexdom-healthtech/pkg-template`, passed to `gh` with `-R`) in [AI agents](#ai-agents), `.claude/agents/` and `.claude/skills/`; once `sayHello()` is gone, point [Adding a new export](#adding-a-new-export) to one of the library's own exports; and keep the library IDs in [Library documentation and dependencies](#library-documentation-and-dependencies) in line with the dependencies the library actually has. `git grep -n "pkg-template" -- AGENTS.md .claude` lists every reference left to replace.

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
- The devcontainer also ships the GitHub CLI (`gh`), which the [AI agents](#ai-agents) use to read issues and PRs. Log in with `gh auth login`.
- On Windows, prefer VS Code's "Dev Containers: Clone Repository in Container Volume" over opening a folder cloned on the host:
  - A host clone with `core.autocrlf=true` checks files out with CRLF, and `vp check` then reports formatting issues on every file. `.gitattributes` enforces LF, but clones made before it was added need `git rm -rq --cached . && git reset --hard` to be re-normalized (commit or stash local changes first, since `reset --hard` discards them).
  - A host folder bind-mounted into the container is much slower, which hurts the slowest checks (mutation tests) the most.

### Everyday commands

| Purpose                         | Command                                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Install deps                    | `vp install`                                                                                                                  |
| Lint, format, type-check        | `vp check` (also runs `--fix` automatically on staged files via `vite.config.ts`)                                             |
| Unit tests                      | `vp test` (add `--coverage` for coverage; the global threshold is 100% on every metric, see [vite.config.ts](vite.config.ts)) |
| Mutation tests                  | `vpr test:mutations` (Stryker; `high`/`low`/`break` thresholds are all 100%, see [stryker.config.json](stryker.config.json))  |
| Architecture / dependency rules | `vpr depcruise` (see [.dependency-cruiser.cjs](.dependency-cruiser.cjs))                                                      |
| Build the library               | `vpr build` / `vp run build`                                                                                                  |
| Docs dev server                 | `vpr docs` / `vp run docs`                                                                                                    |
| Build docs                      | `vpr docs:build` (as CD does; CI doesn't build the docs)                                                                      |

#### Focused runs while iterating

While working on a single file, scope each step to it (`index` below is an example) and run the full sequence (see [CI gate](#ci-gate)) only before finishing:

```bash
# Unit tests of one file, with coverage limited to the source it covers. Without
# `--coverage.include`, files that are only imported count as uncovered and fail the 100% threshold
vp test src/__tests__/index.test.ts --coverage --coverage.include="src/index.ts"

# Mutation tests of specific files. List several files in a single comma-separated `--mutate`
# (repeating the flag keeps only the last one)
vpx stryker run --mutate "src/index.ts"
```

### CI gate

Every PR runs, in order ([.github/workflows/ci.yml](.github/workflows/ci.yml)): commitlint on the PR commits, `vp check`, `vpr depcruise`, `vp test --coverage`, `vpr test:mutations`, and the SonarQube analysis (`vpr sonar`, see [Static analysis](#static-analysis-sonarqube)). All must pass before merge.

Before considering a change done, run the same sequence locally, except SonarQube: `vp check`, `vpr depcruise`, `vp test --coverage` and `vpr test:mutations`. Also run `vpr docs:build` if you touched `docs/`, and check new code against the rules under [Static analysis](#static-analysis-sonarqube), since SonarQube only runs in CI.

### Code conventions

- All published code lives in [src/](src/) and must be written in **English**.
- Public methods/attributes should have **JSDoc** comments (markdown is supported inside them, including code examples) — this is the library's primary documentation mechanism.
- Tests live under `src/__tests__/` using `vite-plus/test` (a Vitest-based runner with `jsdom`); import source via the `@/` path alias (e.g. `@/index.ts`), not relative paths.
- Formatting/linting is handled by `oxc` (config in [vite.config.ts](vite.config.ts)); don't hand-format against its output. Lint runs with `typeAware`/`typeCheck` enabled — don't silence type errors, fix them.
- Architecture rules are enforced by dependency-cruiser ([.dependency-cruiser.cjs](.dependency-cruiser.cjs), extends `recommended-strict`, e.g. no circular dependencies or orphan modules). No module may import test files (`not-to-spec`), non-test code must not import `devDependencies` (`not-to-dev-dep`), and code under `src` (outside `__tests__`) may only import local modules and `peerDependencies` (`use-peer-deps`), which also rules out Node.js built-ins such as `node:path`.
- Known workaround: the `@ts-expect-error` in `docs/.vitepress/config.ts` works around a TypeScript stack depth error. Don't build on top of it without checking whether it's still needed.

### Adding a new export

Use the closest existing export as the reference (in the template, the placeholder `sayHello`: [src/index.ts](src/index.ts), its test in `src/__tests__/index.test.ts` and its page in `docs/api/say-hello.md`), and deliver all of the following in the same PR:

1. The source under `src/`, with JSDoc, exported from `src/index.ts` (the package's only entry point), and its unit tests under `src/__tests__/`.
2. An API reference page in Portuguese at `docs/api/<export-name>.md` (in kebab-case, like `say-hello.md`), following the existing page: the export name as the title, a short description, and the "Exemplo" (stating the result of each example that returns a value), "Parâmetros" and "Retorno" sections. Add a guide page under `docs/guide/` when the feature benefits from narrative examples.
3. Every new page registered in the sidebar at `docs/.vitepress/config.ts` (`/api/` or `/guide/`) and, for API pages, in the `apis` list of `docs/api/index.md`.
4. The export added to the `import` example in [Using this library](#using-this-library), so consumers see the whole public API.
5. The full CI sequence (see [CI gate](#ci-gate)) passing locally, plus `vpr docs:build`.

### Public API design

The public API is hard to change once released: other projects depend on it, and every export, parameter or option is something consumers can misuse and maintainers must keep. Keep it minimal:

- Only add what the issue asks for. Anything beyond it (an extra function, parameter, option, overload or exported type) is a separate decision the maintainers must approve explicitly, not a default.
- Behaviors meant to be consistent across the library aren't per-call options. For example, how empty or invalid input is handled, or how failures are reported, is decided once for the whole library.
- Reuse existing contracts before creating new ones: the parameter order, option object shapes and error types the library already uses, and trailing optional parameters with defaults.
- Helpers and types stay internal unless the API needs them; exporting one is an API addition too. A new entry point (a new path in `package.json#exports`) needs explicit approval.
- Renaming or removing an export, or changing a signature, default or result, is a breaking change: mark the commit with `!` and a `BREAKING CHANGE:` footer, so `semantic-release` publishes a new major version.

### Testing

- Coverage is enforced at **100%** for lines, functions, branches and statements (`test.coverage.thresholds` in [vite.config.ts](vite.config.ts)) — new code must be fully covered, no exceptions baked into config.
- The global setup (`src/__tests__/setup.ts`) enables fake timers and silences `console.error`, `console.warn` and `console.log` in every test: advance timers explicitly, and assert console output through those spies.
- Mutation testing via Stryker ([stryker.config.json](stryker.config.json)) is set to **100/100/100** thresholds (`high`/`low`/`break`) — a passing test suite alone isn't sufficient; mutants must actually be killed. Stryker starts one test runner per CPU core (minus one, above four cores); on machines with limited memory, run `vpx stryker run --concurrency 4` instead of `vpr test:mutations`.
- Keep temporary files (scripts, specs, configs) outside the repo, e.g. in the system's temp folder. Vitest only excludes `node_modules` and `.git` by default, so a temporary spec in a gitignored folder such as `reports/` still runs, and fails, with the unit tests.
- Never run Stryker at the same time as another test command: Vitest would also collect the copies of the tests Stryker makes under `.stryker-tmp/`. For the same reason, delete `.stryker-tmp/` when a failed or interrupted Stryker run leaves it behind (Stryker only cleans it after a successful run).

### Docs conventions

- [docs/](docs/) is a Vitepress site. Unlike `src/`, **docs content must be written in Portuguese** (`pt-BR`) — the docs are aimed at Brazilian users even though the code and code comments are in English.
- New/changed public APIs need the docs pages listed in [Adding a new export](#adding-a-new-export).
- CI doesn't build the docs: only CD does, after the merge (`vpr docs:build` on pushes to `main`, `beta` and `alpha`). Run `vpr docs:build` yourself whenever you change `docs/`, or a broken page only shows up after merging. `vpr docs` and `vpr docs:build` build the library first (`dependsOn: ["build"]` in [vite.config.ts](vite.config.ts)).

### Commits & branching

- Commit messages must follow **Conventional Commits** (enforced by commitlint in CI, `@commitlint/config-conventional`).
- This project uses **trunk-based development**: `main` is the only permanent branch (protected, no direct pushes). Short-lived branches are created from `main` and merged back via PR, then deleted.
- Only use `beta` or `alpha` branches for genuinely unstable/pre-release work or unsettled API signatures — see [CONTRIBUTING.md](CONTRIBUTING.md#when-to-use-beta) for the full flow. Default to branching from and targeting `main`.
- Versioning and releases (via `semantic-release`, config in [package.json](package.json)) are fully automated from commit messages — never hand-edit version numbers or changelogs.

### Pull requests

- Open PRs against `main` (or `beta`/`alpha` per the branching rules above), never push directly to protected branches.
- Follow [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md): describe _what_ the PR solves (or link the issue), and include tests that fail without the change and pass with it when possible.

### Static analysis (SonarQube)

The company's SonarQube runs only in CI, as its last step (the `sonar` task in [vite.config.ts](vite.config.ts), with the `SONAR_TOKEN` secret; see [CONTRIBUTING.md](CONTRIBUTING.md#development)). `sonar.qualitygate.wait=true` in [sonar-project.properties](sonar-project.properties) makes the step fail when the quality gate fails, so treat any new issue or unreviewed security hotspot in `src/` as a failure. Don't run the `sonar` task locally: it needs `SONAR_TOKEN` and publishes the analysis to the company's server.

Write code that avoids the rules that have already failed code in other NEXDOM libraries analyzed by the same server: use `globalThis` instead of `window` (S7764); `.at(-1)` instead of `[array.length - 1]` (S7755); `replaceAll` instead of `replace` with a global regular expression (S7781); object spread instead of `Object.assign({}, ...)` (S6661); `String.raw` instead of escaped backslashes in strings (S7780); concise regular expressions, such as `\d` instead of `[0-9]` (S6353) and no single-character classes like `[9]` (S6397); no regular expressions with super-linear backtracking, such as two overlapping quantifiers (S5852); no redundant non-null or type assertions, which don't change the type (S4325); no deprecated APIs (S1874); and move inner functions that don't use anything from the outer function out of it (S7721).

Only if CI's SonarQube step fails and its dashboard doesn't show why, reproduce the analysis with a local SonarQube Community in the server's version (`sonarqube:26.3.0.120487-community`; the step's log prints the server version) and `vpx @sonar/scan` pointed at it (`-Dsonar.host.url=http://localhost:9000 -Dsonar.token=<local token>`), after `CI=true vp test --coverage` (coverage only writes the `lcov` report Sonar reads when `CI` is set). The goal is 0 issues and no new security hotspots in the files the PR changed.

### Library documentation and dependencies

The stack is newer than most AI models' training data (TypeScript 6, Vite+ 1, Vitest 5, VitePress 2 alpha, Stryker 10, dependency-cruiser 18, jsdom 30), so don't rely on memory for library APIs.

- Before using an API this repo doesn't use yet, or implementing something from scratch, look it up in the version declared in `package.json`. The project's `.mcp.json` provides the `context7` server for that, with these library IDs: TypeScript `/microsoft/typescript`, Vite+ `/websites/viteplus_dev`, Vitest `/vitest-dev/vitest`, VitePress `/vuejs/vitepress`, Vue (docs theme and pages) `/websites/vuejs`, Stryker `/stryker-mutator/stryker-js`, dependency-cruiser `/sverweij/dependency-cruiser`, jsdom (the unit tests' environment) `/jsdom/jsdom`, and MDN `/mdn/content` for JavaScript built-ins and Web APIs.
- Queries to Context7 leave your machine: describe what you need in generic terms and never include source code or business rules.
- Before adding a dependency, check whether the platform or the current dependencies already cover the need. If not, confirm with the requester, check the package's docs, maintenance and license, and declare runtime dependencies as `peerDependencies` (enforced by dependency-cruiser's `use-peer-deps` rule).

### AI agents

Besides this file, the repo ships Claude Code subagents in `.claude/agents/`:

- `issue-planner`: turns an issue into an API proposal plus open questions, before any code is written.
- `issue-implementer`: implements an issue end to end (source, tests, docs).
- `code-reviewer`: reviews a branch or PR against these conventions, without changing code.
- `dependency-updater`: evaluates and applies dependency updates, such as Dependabot PRs.

Issues and PRs live in `nexdom-healthtech/pkg-template`. Pass `-R nexdom-healthtech/pkg-template` to `gh`, since clones from forks have issues disabled, and read issues with `gh issue view <number> -R nexdom-healthtech/pkg-template --json title,body,comments` (`--comments` prints nothing in non-interactive shells).

To resolve an issue, run `/resolve-issue <number>` (`.claude/skills/resolve-issue/`). It chains planner, implementer and reviewer, asks you about open questions and waits for your approval of the public API before any code is written.

`.claude/settings.json` allows the check commands above and read-only `git`/`gh` commands, and asks before pushing, opening or merging PRs, adding dependencies or running SonarQube. The agents don't commit, push or open PRs unless asked, and they don't replace the author's review: the PR template asks the author to confirm the PR reflects their own understanding of the project.
