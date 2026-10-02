#!/bin/sh
# Grade-time runner: the tests the student never saw, against whatever is in
# src/ right now.
set -e
cd "$(dirname "$0")/../.."
exec python3 -m unittest discover -s teacher/hidden -v
