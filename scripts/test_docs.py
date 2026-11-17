#!/usr/bin/env python3
"""Hold the prose to the writing skill.

Two failures this pins, both paid for twice:

- A long `AGENTS.md` competes with the task for context on every turn. Its rules
  are the ones that must never be forgotten; everything else belongs in the skill
  that needs it. The cap is a ratchet, not a style opinion.
- A filler phrase hides a sentence that does no work. The rules live in
  `skills/writing/SKILL.md`; this file is how they still hold after the sentence
  that wrote them is forgotten.

Code spans, fences and quoted blocks are stripped before the scan: a doc has to
be able to name the words it bans, and code is copied, not written.

It lives in `scripts/` and not `checks/` because `checks/` is vendored from the
kit with the tools; a file there that the kit does not have fails the `vendored`
gate, and a later `--sync` would delete it. This test guards this workflow's own
prose, so it sits with this workflow's own scripts.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AGENTS = ROOT / "AGENTS.md"
WRITING = ROOT / "skills" / "writing" / "SKILL.md"

MAX_LINES = 65
MAX_BYTES = 3000

FILLER = (
    "in order to",
    "it is important to note",
    "it should be noted",
    "please note",
    "as an ai",
    "delve",
    "utilize",
    "leverage",
    "seamless",
    "landscape",
    "journey",
    "unlock",
    "robust",
    "holistic",
    "best-in-class",
    "game-changer",
    "deep dive",
    "circle back",
    "touch base",
    "needless to say",
    "it goes without saying",
)


def prose(path: Path) -> str:
    """The file's fiction: fenced blocks, code spans and frontmatter removed."""
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"\A---\n.*?\n---\n", "", text, count=1, flags=re.S)
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"`[^`\n]*`", "", text)
    return text


def docs() -> list[Path]:
    paths = [AGENTS, *(ROOT / "templates").glob("*.md")]
    paths += sorted((ROOT / "skills").glob("*/SKILL.md"))
    paths += sorted((ROOT / "skills").glob("*/*/SKILL.md"))
    paths += sorted((ROOT / "rules").glob("*.md"))
    return [p for p in paths if p.is_file()]


class AgentsFileTest(unittest.TestCase):
    def test_it_stays_short(self):
        lines = AGENTS.read_text(encoding="utf-8").splitlines()
        size = AGENTS.stat().st_size
        self.assertLessEqual(
            len(lines),
            MAX_LINES,
            f"AGENTS.md is {len(lines)} lines (cap {MAX_LINES}). It loads on every "
            "turn: move the detail into the skill that needs it, or delete it.",
        )
        self.assertLessEqual(
            size,
            MAX_BYTES,
            f"AGENTS.md is {size} bytes (cap {MAX_BYTES}). Same rule, measured in "
            "context: cut words, not meaning.",
        )

    def test_it_names_the_writing_skill(self):
        text = AGENTS.read_text(encoding="utf-8")
        self.assertIn(
            "`writing` skill",
            text,
            "AGENTS.md must point at the `writing` skill: it carries the voice "
            "rules, and a pointer is cheaper than repeating them.",
        )

    def test_the_principles_are_numbered_and_once_each(self):
        text = AGENTS.read_text(encoding="utf-8")
        block = text.split("## Principles", 1)[1].split("##", 1)[0]
        numbers = re.findall(r"^(\d+)\. \*\*", block, flags=re.M)
        self.assertEqual(
            numbers,
            [str(n) for n in range(1, len(numbers) + 1)],
            "the principles are a numbered list, in order: a skill cites one by "
            "number (`rules/principle-prove-it-works.md` does).",
        )
        self.assertGreaterEqual(len(numbers), 4, "one principle per decision it changes")


class WritingSkillTest(unittest.TestCase):
    def test_it_exists_and_declares_its_name(self):
        self.assertTrue(WRITING.is_file(), "skills/writing/SKILL.md is the voice")
        text = WRITING.read_text(encoding="utf-8")
        self.assertIn("name: writing", text)
        self.assertIn("description:", text)


class FillerTest(unittest.TestCase):
    def test_no_filler_in_anything_a_person_reads(self):
        hits = []
        for path in docs():
            words = prose(path).lower()
            hits += [
                f"{path.relative_to(ROOT)}: {phrase}"
                for phrase in FILLER
                if re.search(rf"\b{re.escape(phrase)}\b", words)
            ]
        self.assertEqual(
            hits,
            [],
            "filler found — name the concrete thing instead:\n  " + "\n  ".join(hits),
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
