# phunt

[![phunt: Continuous Integration](https://github.com/112dev/phunt/actions/workflows/ci.yml/badge.svg)](https://github.com/112dev/phunt/actions/workflows/ci.yml)

phunt - is a collection of software which can help end users organize digital media such as photos and images.

## Structure

The current structure of the project is based on monorepo architecture leveraging [Turborepo](https://turbo.build/) to
handle build tasks.

The structure of the project looks like this:

- `root` - monorepo
  - `apps` - standalone applications which end users will use
  - `packages` - internal modular software libraries which help build `apps`

## Build

To build all `apps` and `packages` from source, run the following command from project root:

```
pnpm build
```

## Develop

To develop all `apps` and `packages`, run the following command from project root:

```
pnpm dev
```

This command will start a daemon which will listen to file changes while develop and rebuild all related projects.

## License

The code in the `root` monorepo is licensed under the [Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0).

All subcomponents within the `root`, including `apps` and `packages`, are also licensed under
the [Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0) unless otherwise specified in their source. The
applicable license for each subcomponent will be documented in one of the following ways:

- A dedicated `README`, `LICENSE`, or `COPYRIGHT` file within the subcomponent
- A license header within the source code files

Please refer to the specific documentation for each subcomponent for detailed licensing information.
