#!/bin/sh
# Grade-time runner: the tests the student never saw, against whatever is in
# src/ right now. Compiled separately from the visible tests so the student's
# Makefile stays theirs.
set -e
cd "$(dirname "$0")/../.."
mkdir -p build
CC="${CC:-cc}"
"$CC" -std=c11 -Wall -Wextra -Isrc -o build/hidden_test \
    src/exercise.c teacher/hidden/test_hidden_exercise.c
exec ./build/hidden_test
