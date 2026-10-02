#!/bin/sh
# Grade-time runner: the tests the student never saw, against whatever is in
# src/ right now.
set -e
cd "$(dirname "$0")/../.."
exec node --test "teacher/hidden/**/*.test.js"
