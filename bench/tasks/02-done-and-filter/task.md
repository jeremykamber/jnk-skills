# Done, and filtering

Add two things to the CLI.

`python3 -m ticket done <id>` marks that ticket `done`. It prints nothing and
exits 0. An id that does not exist is an error: print a message and exit 1.

`python3 -m ticket list --open` prints only tickets whose state is `open`.
Plain `list` still prints every ticket.

Read the README first; the rules there apply.
