# Contributing to the project

Thank you for considering contributing to phunt project. Please take a moment to review this guide to help you get
started.

## Table of Contents

- [How to Contribute](#how-to-contribute)
  - [Issues](#issues)
  - [Pull Requests](#pull-requests)
  - [Branching Strategy](#branching-strategy)
  - [Commits](#commits)
- [Project Structure](#project-structure)
- [Setting up Local Development Environment](#setting-up-local-development-environment)

## How to Contribute

### Issues

- Before creating an issue, check if the problem has been already reported in
  the [issue tracker](https://github.com/112dev/phunt/issues).
- Provide as much context as possible (e.g., error messages, logs, screenshots).
- Use the predefined issue templates for bug reports and new feature requests if available.

### Pull Requests

Third-party pull (merge) requests are welcome. However, before investing time in developing a change, please reach out
to the project maintainers to confirm that the proposed modification is necessary and aligned with the project’s
direction. This project follows a highly opinionated approach, and only changes that are deemed beneficial to its
long-term success will be accepted.

### Branching Strategy

The project follows the [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) branching
strategy. This is a straightforward approach that uses a single stable branch, `main`. For any new changes, a feature
branch is created from `main`, where the work is done. Once the changes are ready, a pull request is opened to merge the
updates back into `main`.

### Commits

Commits should ideally be **self-contained** (atomic) and **descriptive**. A well-crafted commit message focuses on the
reasoning behind the change rather than just describing the change itself. When writing a commit message, prioritize
answering **why** the change was necessary over **what** was changed.

Key points:

- **Atomic commits**: Each commit should represent a single, focused change. This makes it easier to understand and
  revert if necessary.
- **Descriptive messages**: A good commit message explains the motivation behind the change (why it was needed), not
  just the technical details of what was altered.
- **Issue tracking**: If your commit addresses or relates to an open GitHub issue, reference the issue number in the
  commit message. This helps maintain a clear link between code changes and issue discussions. Use the
  format `#123` where `123` is the issue number.

Commits that are not self-contained or lack meaningful descriptions are likely to be **squashed** before merging to
maintain a clean and readable history.

## Project Structure

The current structure of the project is based on monorepo architecture leveraging [Turborepo](https://turbo.build/) to
handle build tasks.

The structure of the project looks like this:

- `root` - monorepo
  - `apps` - standalone applications which end users will use
  - `packages` - internal modular software libraries which help build `apps`

## Setting up Local Development Environment

To get started with local development, ensure you have **Git**, **Node.js**, and **yarn** installed. Check the
package.json `engines` section for the supported versions.

Once you've cloned the repository, install the dependencies by running the following command from the project root:

```shell
yarn install
```

To build all apps and packages from source, run the following command from project root:

```shell
yarn build
```

Optionally, you could start a daemon which will listen to the changes you make and rebuild automatically the modified
packages. To start the daemon, run the following command from project root:

```shell
yarn dev
```

Note: The `yarn dev` command is currently experimental and not all packages support it.

For other useful commands check package.json scripts section.
