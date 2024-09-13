# phunt-cli

`phunt-cli` is a command-line tool designed to help users organize digital media such as images and photos.

## How It Works

`phunt-cli` includes two main subcommands: `index` and `sync`.

- `index`: This subcommand indexes the media files in a specified destination directory.

- `sync`: This subcommand synchronizes media files from one or more sources to a destination directory. If the
  destination directory has not been indexed previously, `sync` will first perform the indexing operation before
  syncing.

For more detailed usage instructions, refer to the built-in manual by appending the `--help` option to any command.

## How to Install

### Automatically: Using a Node Package Manager

The `phunt-cli` package is available on the [npm registry](https://www.npmjs.com/). You can install it globally using
your preferred package manager. Once installed, you can use the phunt command directly from your shell.

### Manually: Using Release Artifacts

Each release includes prebuilt distribution artifacts for various operating systems, Node.js versions, and
architectures.

You can download the appropriate artifact for your system and install it manually.

## License

`phunt-cli` is open source software licensed under [Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0).
