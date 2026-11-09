# Priorities

Tickets get a priority.

`python3 -m ticket add "<title>" --priority high|normal|low` sets it; the
default is `normal`.

`python3 -m ticket list` prints one line per ticket, tab-separated:

    <id>\t<state>\t<priority>\t<title>

`python3 -m ticket list --sort priority` orders tickets high, then normal, then
low. Ties keep id order. `--open` still filters, and combines with `--sort`.

Read the README first; the rules there apply.
