#!/bin/sh
# Run the visible tests from the repository root, so the command works no
# matter which directory the student happens to be standing in.
set -e
cd "$(dirname "$0")"
exec python3 -m unittest discover -s tests -v
