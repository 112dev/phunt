# phunt-desktop

`phunt-desktop` is a user-friendly desktop application designed to help users organize their photo collections with
ease. Building on the powerful command-line features of `phunt-cli`, this application brings a graphical interface for
more intuitive navigation and control over your digital media assets, such as photos and images.

## Development

### Developing on Ubuntu (24.04)

Ubuntu 24.04 implemented some security features which prevent Electron apps to start (
see https://github.com/electron/electron/issues/42510).

At the time of this writing there were two workarounds:

1. Disable new security policies globally on the system
   `sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0`

2. Change ownership of electron binary
   `sudo chown root ./node_modules/electron/dist/chrome-sandbox && sudo chmod 4755 ./node_modules/electron/dist/chrome-sandbox`

I would advise to proceed with the second solution. One downside of the second solution is that you will need to
occasionally reapply the fix if electron gets updated in `node_modules`.

## License

`phunt-desktop` is open source software licensed under [Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0).
