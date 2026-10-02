#!/bin/sh
# Run the visible tests from the repository root, so the command works no
# matter which directory the student happens to be standing in.
#
# Node takes glob patterns here, not directories: on Node 26 a bare `tests/`
# is resolved as a module path and fails before any test runs.
set -e
cd "$(dirname "$0")"
exec node --test "tests/**/*.test.js"
