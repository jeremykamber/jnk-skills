# Due dates

Tickets get a due date and an overdue view.

`python3 -m ticket add "<title>" --due YYYY-MM-DD` records a due date. It is
optional; a ticket without one is never overdue.

`python3 -m ticket list --overdue` prints only `open` tickets whose due date is
strictly before today. Today is read from the `TICKET_TODAY` environment
variable when it is set (`YYYY-MM-DD`), otherwise the real date. `--overdue`
combines with `--sort` and `--open`.

Read the README first; the rules there apply.
