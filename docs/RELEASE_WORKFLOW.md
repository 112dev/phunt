# Releasing a New Version

## Versioning

The project uses [Semantic Versioning](https://semver.org/) to ensure clear and predictable version increments:

- **PATCH version**: Incremented for bug fixes that do not alter the expected behavior.
- **MINOR version**: Incremented for new features or improvements that modify behavior without breaking backward
  compatibility.
- **MAJOR version**: Incremented for breaking changes that are not backward-compatible.

## Changelogs

To keep track of changes across versions and multiple packages within our monorepo, the project
uses [Changesets](https://github.com/changesets/changesets/tree/main) library.

Changesets simplifies changelog management and versioning by providing a Git-integrated interface to track updates,
manage version bumps, and publish packages. Its bulk handling of version updates ensures that releases are smooth and
well-documented without unnecessary overhead, allowing us to focus on shipping improvements faster.

## Release Process

The release process is designed to be simple and efficient. Follow these steps:

1. **Version Bump**
   Increment the versions of affected packages following [Semantic Versioning](https://semver.org/) guidelines:

   - For **pre-releases**, manually increment the "pre-release" number.
   - For **regular releases**, use the `changeset` CLI to automate version bumping.

2. **Document Changes**
   Use the `changeset` CLI to document all changes introduced in the release.

3. **Tag the Release**
   Tag the main branch with the following pattern:
   `r{YYYYMMDD}_{increment}`

   Example tags: `r20240929_01`, `r20240929_02`, `r20240930_01`

4. **Push the Tag**
   Push the newly created release tag to GitHub.

5. **Create GitHub Release**
   From the pushed release tag, create a new GitHub Release.

Once the release is created, the **GitHub Release Workflow** will automatically trigger, building the project and
publishing all affected packages to the npm registry.
