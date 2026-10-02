# There is no build system beyond this file: the exercise and the visible tests
# are compiled together on every run. The compile is fast, and always
# recompiling means a test run can never report on a stale binary — a solution
# copied over src/ with the same timestamp as the last build would otherwise be
# ignored by make's timestamp check.
CC ?= cc
CFLAGS ?= -std=c11 -Wall -Wextra -g

test:
	@mkdir -p build
	$(CC) $(CFLAGS) -Isrc -o build/test_exercise src/exercise.c tests/test_exercise.c
	./build/test_exercise

.PHONY: test clean
clean:
	rm -rf build
