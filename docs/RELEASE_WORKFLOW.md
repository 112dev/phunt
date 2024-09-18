# Releasing a New Version

## The Process

The release process is designed to be straightforward and efficient:

1. **Create a milestone**: Define the scope of the release by setting up a milestone in the project.
2. **Complete the milestone**: Once all tasks or issues tied to the milestone are addressed, proceed with the release.
3. **Version the release**: Set the new version number and tag the release appropriately.
4. **Trigger the release workflow**: Kick off the semi-automated GitHub Actions workflow to finalize and publish the
   release.

This process ensures a structured, automated approach, minimizing manual intervention while maintaining control over the
release.

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
