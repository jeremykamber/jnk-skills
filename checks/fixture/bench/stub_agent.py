#!/usr/bin/env python3
"""A stand-in for the coding agent, so `bench` can be tested without an LLM.

It ignores every flag, writes a `ticket.py` into the current directory, and
prints the same JSONL event shape the harness prints. STUB_SLOPPY=1 writes a
deliberately bad implementation, so a test can prove the slop metric moves.
"""
import json
import os
from pathlib import Path

CLEAN = '''import json
import os
import sys
from datetime import date

STORE = ".tickets.json"
ORDER = {"high": 0, "normal": 1, "low": 2}


def load():
    try:
        with open(STORE) as handle:
            return json.load(handle)
    except FileNotFoundError:
        return []


def save(items):
    with open(STORE, "w") as handle:
        json.dump(items, handle)


def options(args):
    found = {"title": None, "priority": "normal", "due": None}
    index = 0
    while index < len(args):
        current = args[index]
        if current == "--priority":
            found["priority"] = args[index + 1]
            index += 2
        elif current == "--due":
            found["due"] = args[index + 1]
            index += 2
        elif found["title"] is None:
            found["title"] = current
            index += 1
        else:
            index += 1
    return found


def add(items, args):
    values = options(args)
    items.append({
        "id": max([item["id"] for item in items], default=0) + 1,
        "title": values["title"],
        "state": "open",
        "priority": values["priority"],
        "due": values["due"],
    })
    save(items)
    print(items[-1]["id"])


def listing(items, args):
    if "--open" in args:
        items = [item for item in items if item["state"] == "open"]
    if "--overdue" in args:
        today = os.environ.get("TICKET_TODAY") or date.today().isoformat()
        items = [item for item in items
                 if item["state"] == "open" and item["due"] and item["due"] < today]
    if "--sort" in args and args[args.index("--sort") + 1] == "priority":
        items = sorted(items, key=lambda item: ORDER.get(item["priority"], 1))
    for item in items:
        print("\\t".join([str(item["id"]), item["state"], item["priority"], item["title"]]))


def main(argv):
    command = argv[0] if argv else ""
    args = argv[1:]
    items = load()
    if command == "add":
        add(items, args)
        return 0
    if command == "list":
        listing(items, args)
        return 0
    if command == "done":
        try:
            target = int(args[0])
        except (IndexError, ValueError):
            print("usage: ticket done <id>", file=sys.stderr)
            return 2
        if not any(item["id"] == target for item in items):
            print("no such ticket:", target, file=sys.stderr)
            return 1
        for item in items:
            if item["id"] == target:
                item["state"] = "done"
        save(items)
        return 0
    print("usage: ticket add|list|done", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
'''

SLOPPY = '''import json
import os
import sys
import datetime

ORDER = {"high": 0, "normal": 1, "low": 2}


def main(argv):
    command = argv[0] if argv else ""
    args = argv[1:]
    try:
        f = open(".tickets.json")
        items = json.load(f)
        f.close()
    except:
        items = []
    if command == "add":
        title = None
        priority = "normal"
        due = None
        i = 0
        while i < len(args):
            if args[i] == "--priority":
                priority = args[i + 1]
                i = i + 2
            elif args[i] == "--due":
                due = args[i + 1]
                i = i + 2
            elif title is None:
                title = args[i]
                i = i + 1
            else:
                i = i + 1
        new_id = 1
        for item in items:
            if item["id"] >= new_id:
                new_id = item["id"] + 1
        items.append({"id": new_id, "title": title, "state": "open", "priority": priority, "due": due})
        f = open(".tickets.json", "w")
        json.dump(items, f)
        f.close()
        print(new_id)
        return 0
    elif command == "list":
        rows = []
        if "--open" in args:
            for item in items:
                if item["state"] == "open":
                    rows.append(item)
        else:
            for item in items:
                rows.append(item)
        if "--overdue" in args:
            keep = []
            if os.environ.get("TICKET_TODAY"):
                today = os.environ["TICKET_TODAY"]
            else:
                today = datetime.date.today().isoformat()
            for item in rows:
                if item["state"] == "open":
                    if item["due"]:
                        if item["due"] < today:
                            keep.append(item)
            rows = keep
        if "--sort" in args:
            if args[args.index("--sort") + 1] == "priority":
                high = []
                normal = []
                low = []
                for item in rows:
                    if item["priority"] == "high":
                        high.append(item)
                    elif item["priority"] == "low":
                        low.append(item)
                    else:
                        normal.append(item)
                rows = high + normal + low
        for item in rows:
            print(str(item["id"]) + "\\t" + item["state"] + "\\t" + item["priority"] + "\\t" + item["title"])
        return 0
    elif command == "done":
        found = False
        for item in items:
            if str(item["id"]) == str(args[0]):
                item["state"] = "done"
                found = True
        if not found:
            print("no such ticket", file=sys.stderr)
            return 1
        f = open(".tickets.json", "w")
        json.dump(items, f)
        f.close()
        return 0
    print("usage", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
'''

source = SLOPPY if os.environ.get("STUB_SLOPPY") == "1" else CLEAN
Path("ticket.py").write_text(source)
Path("tests").mkdir(exist_ok=True)
Path("tests/test_ticket.py").write_text("import unittest\n\n\nclass Smoke(unittest.TestCase):\n    def test_import(self):\n        self.assertTrue(True)\n")

tokens = int(os.environ.get("STUB_TOKENS", "100"))
events = [
    {"type": "message_end", "message": {"role": "assistant", "model": "stub-1",
     "content": [{"type": "toolCall", "name": "write"}],
     "usage": {"totalTokens": tokens, "cost": {"total": 0.001}}}},
    {"type": "agent_settled", "aborted": False},
]
for event in events:
    print(json.dumps(event))
