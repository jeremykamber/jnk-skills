Add tickets to the CLI.

`python3 -m ticket add "<title>"` stores a new ticket and prints its id on its
own line — 1 for the first ticket, then 2, 3, and so on.

`python3 -m ticket list` prints one line per ticket, tab-separated:

    <id>\t<state>\t<title>

A new ticket's state is `open`. Tickets print in id order.

Read the README first; the rules there apply.
