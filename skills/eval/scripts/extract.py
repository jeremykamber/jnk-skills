#!/usr/bin/env python3
"""
extract.py — turn a pi session export into evaluation material for the workflow.

Reads a pi session export in either format:
  - .jsonl  one JSON entry per line (messages, tool results, model changes)
  - .html   the pi "Session Export" page; the session JSON is base64-encoded
            in the first <script> tag

Writes into an output directory (default: <input>.eval/):
  - transcript.txt  chronological, readable dump. Every block header carries
                    the transcript line number (lineN) so stats can point at
                    exact moments.
  - thinking.txt    the reasoning traces only — the leading-word adoption
                    evidence.
  - stats.json      the quick scan: counts, skill invocations, leading-word
                    adoption by category, artifact mentions/writes, gates,
                    squawks, slices.

Notes:
  - Run without rtk: the stdout summary is needed in full.
  - Stdlib only; works anywhere python3 exists.

Usage:
  python3 scripts/extract.py <transcript.jsonl|transcript.html> [outdir]
"""
import argparse
import base64
import json
import os
import re
import sys

# --------------------------------------------------------------------------
# loading
# --------------------------------------------------------------------------

def load_entries(path):
    data = open(path, "r", encoding="utf-8", errors="replace").read()
    if path.endswith(".html"):
        m = re.search(r"<script[^>]*>(.*?)</script>", data, re.S)
        if not m:
            sys.exit("extract.py: no <script> tag found in HTML export")
        try:
            obj = json.loads(base64.b64decode(m.group(1).strip()))
        except Exception as e:
            sys.exit(f"extract.py: could not base64-decode HTML export: {e}")
        entries = obj.get("entries") if isinstance(obj, dict) else obj
        if not isinstance(entries, list):
            sys.exit("extract.py: decoded HTML export has no entries list")
        return entries
    entries = []
    for i, line in enumerate(data.splitlines(), 1):
        if not line.strip():
            continue
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            sys.exit(f"extract.py: line {i} is not valid JSON")
    return entries

# --------------------------------------------------------------------------
# rendering
# --------------------------------------------------------------------------

def render_entry(entry):
    """Return a list of (kind, text) blocks for one entry."""
    etype = entry.get("type")
    if etype == "session":
        return [("meta", f"SESSION {entry.get('id','?')} cwd={entry.get('cwd','?')}")]
    if etype in ("model_change", "thinking_level_change"):
        return [("meta", f"{etype}: {json.dumps({k: v for k, v in entry.items() if k not in ('id','parentId')})}")]
    if etype != "message":
        return [("meta", f"{etype}: {json.dumps(entry, default=str)[:400]}")]

    msg = entry.get("message") or {}
    role = msg.get("role", "?")
    blocks = []
    for p in msg.get("content") or []:
        t = p.get("type")
        if t == "text":
            if role == "toolResult":
                blocks.append(("toolResult", p.get("text", "")))
            else:
                blocks.append((role, p.get("text", "")))
        elif t == "thinking":
            blocks.append(("thinking", p.get("thinking", "")))
        elif t == "toolCall":
            args = p.get("arguments")
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except Exception:
                    pass
            blocks.append(("toolCall", f"{p.get('name','?')} {json.dumps(args)}"))
        elif t == "toolResult":
            txt = p.get("text")
            if txt is None:
                txt = p.get("content")
            if isinstance(txt, list):
                txt = json.dumps(txt)
            blocks.append(("toolResult", str(txt)))
        else:
            blocks.append(("meta", f"unknown part {t}: {json.dumps(p, default=str)[:400]}"))
    return blocks

# --------------------------------------------------------------------------
# assembly
# --------------------------------------------------------------------------

HEADER = {
    "user":       "### [user TEXT] line{start}",
    "assistant":  "### [assistant TEXT] line{start}",
    "thinking":   "### [thinking] line{start}",
    "toolCall":   ">>> [toolCall line{start}] {text}",
    "toolResult": "<<< [toolResult line{start}]",
    "meta":       "## {text}",
}

def assemble(entries):
    """Build transcript lines + parallel block index.

    Returns (transcript_text, think_blocks, block_index) where:
      - think_blocks is [(start_line, text), ...]
      - block_index is [(start_line, kind, text), ...] for stats scanning
    """
    transcript = []
    think_blocks = []
    block_index = []
    for entry in entries:
        for kind, text in render_entry(entry):
            start = len(transcript) + 1
            if kind == "thinking":
                think_blocks.append((start, text))
            block_index.append((start, kind, text))
            hdr = HEADER.get(kind, "### [{kind}] line{start}")
            if kind == "toolCall":
                transcript.append(hdr.format(start=start, text=text))
            elif kind == "meta":
                transcript.append(hdr.format(text=text))
            else:
                transcript.append(hdr.format(start=start))
                transcript.extend(text.split("\n"))
    return "\n".join(transcript), think_blocks, block_index

# --------------------------------------------------------------------------
# stats
# --------------------------------------------------------------------------

def load_leading_words(script_dir):
    """word|category per line, regex allowed, case-insensitive."""
    path = os.path.join(script_dir, "..", "references", "leading-words.txt")
    default = [
        (r"\bgates?\b", "discipline"),
        (r"\bcheckpoints?\b", "discipline"),
        (r"\bsquawks?\b", "discipline"),
        (r"\biou(?:s)?\b", "discipline"),
        (r"\bblast radius\b", "discipline"),
        (r"\bhold short\b", "discipline"),
        (r"\bvertical slices?\b", "doctrine"),
        (r"\btracer bullets?\b", "doctrine"),
        (r"\bwalking skeletons?\b", "doctrine"),
        (r"\bred[- ]green\b", "doctrine"),
        (r"\bcallsigns?\b", "artifact"),
        (r"\bledgers?\b", "artifact"),
        (r"\bowed\b", "artifact"),
        (r"\bnotebooks?\b", "artifact"),
        (r"\bdebriefs?\b", "artifact"),
        (r"understanding\.md", "artifact"),
        (r"decisions\.md", "artifact"),
        (r"notes\.md", "artifact"),
        (r"verification/results\.md", "artifact"),
        (r"\.ai/contexts", "artifact"),
        (r"\bpre[- ]flight\b", "scenery"),
        (r"\bhangars?\b", "scenery"),
        (r"\brunways?\b", "scenery"),
        (r"\bhammocks?\b", "scenery"),
        (r"\bsimulators?\b", "scenery"),
        (r"\bcaptain'?s log\b", "scenery"),
        (r"\bflight plans?\b", "scenery"),
    ]
    entries = []
    if os.path.exists(path):
        for raw in open(path, encoding="utf-8"):
            raw = raw.strip()
            if not raw or raw.startswith("#"):
                continue
            if "|" in raw:
                pat, cat = raw.rsplit("|", 1)
            else:
                pat, cat = raw, "other"
            entries.append((pat, cat.strip()))
    else:
        entries = default
    return [(re.compile(p, re.IGNORECASE), c) for p, c in entries]

def compute_stats(entries, think_blocks, block_index, script_dir):
    stats = {}
    # counts: entry-level roles, plus block-level sizes
    roles = {}
    for e in entries:
        if e.get("type") == "message":
            r = (e.get("message") or {}).get("role", "?")
            roles[r] = roles.get(r, 0) + 1
    counts = {"entries": len(entries)}
    for e in entries:
        k = "entry_" + (e.get("type") or "?")
        counts[k] = counts.get(k, 0) + 1
    counts["messages"] = roles
    toolnames = {}
    block_kinds = {}
    for _, kind, text in block_index:
        block_kinds[kind] = block_kinds.get(kind, 0) + 1
        if kind == "toolCall":
            name = text.split(None, 1)[0]
            toolnames[name] = toolnames.get(name, 0) + 1
    counts["blocks"] = block_kinds
    counts["toolCallNames"] = toolnames
    counts["thinkingBlocks"] = len(think_blocks)
    counts["assistantChars"] = sum(len(t) for _, k, t in block_index if k == "assistant")
    counts["thinkingChars"] = sum(len(t) for _, t in think_blocks)
    stats["counts"] = counts

    # skill invocations (user text carries <skill name="...">)
    stats["skillInvocations"] = [
        {"name": m.group(1), "line": start}
        for start, kind, text in block_index
        if kind == "user" for m in re.finditer(r'<skill name="([^"]+)"', text)
    ]

    # leading words on thinking traces: occurrences AND distinct blocks
    words = {}
    cats = {}
    for pat, cat in load_leading_words(script_dir):
        hits = []
        occ = 0
        for start, text in think_blocks:
            n = len(pat.findall(text))
            if n:
                hits.append(start)
                occ += n
        words[pat.pattern] = {"category": cat, "occurrences": occ, "blocks": len(hits), "lines": hits}
        cats[cat] = cats.get(cat, 0) + occ
    stats["leadingWords"] = words
    stats["leadingWordCategories"] = cats

    # artifacts: mentions anywhere, writes only via toolCall named write
    artifact_pats = [
        (re.compile(r"\.ai/contexts"), "notebook dir"),
        (re.compile(r"understanding\.md"), "understanding.md"),
        (re.compile(r"decisions\.md"), "decisions.md"),
        (re.compile(r"notes\.md"), "notes.md"),
        (re.compile(r"plans/"), "plans/"),
        (re.compile(r"verification/results\.md"), "verification/results.md"),
    ]
    artifacts = {}
    writes = []
    for start, kind, text in block_index:
        if kind == "toolCall" and text.startswith("write "):
            if re.search(r"\.ai/contexts", text):
                writes.append({"line": start, "call": text[:200]})
        for pat, label in artifact_pats:
            if pat.search(text):
                a = artifacts.setdefault(label, {"count": 0, "lines": []})
                a["count"] += 1
                a["lines"].append(start)
    stats["artifacts"] = artifacts
    stats["artifactWrites"] = writes

    # gates in visible assistant text
    gate_pat = re.compile(r"\bReady for\b|\bReady to\b|\bApprove\b|\bSound good\b|\bIs this right\b", re.I)
    gates = [start for start, kind, text in block_index if kind == "assistant" and gate_pat.search(text)]
    stats["gates"] = {"count": len(gates), "lines": gates}

    # squawks
    sq_pat = re.compile(r"\[squawk\]", re.I)
    squawks = [start for start, kind, text in block_index if kind in ("assistant", "thinking") and sq_pat.search(text)]
    stats["squawks"] = {"count": len(squawks), "lines": squawks}

    # slices + owed in assistant text
    sl_pat = re.compile(r"\bslice\b", re.I)
    slices = [start for start, kind, text in block_index if kind == "assistant" and sl_pat.search(text)]
    ow_pat = re.compile(r"\bowed\b", re.I)
    owed = [start for start, kind, text in block_index if kind in ("assistant", "thinking") and ow_pat.search(text)]
    stats["slices"] = {"count": len(slices), "lines": slices}
    stats["owed"] = {"count": len(owed), "lines": owed}

    return stats

# --------------------------------------------------------------------------
# summary + main
# --------------------------------------------------------------------------

def print_summary(stats):
    c = stats["counts"]
    r = c.get("messages", {})
    print("== counts ==")
    print(f"  entries: {c.get('entries',0)}  messages: user {r.get('user',0)}, "
          f"assistant {r.get('assistant',0)}, toolResult {r.get('toolResult',0)}")
    b = c.get("blocks", {})
    print(f"  blocks: thinking {b.get('thinking',0)}, text {b.get('assistant',0)+b.get('user',0)}, "
          f"toolCall {b.get('toolCall',0)}, toolResult {b.get('toolResult',0)}")
    print(f"  assistant chars: {c.get('assistantChars',0)}  thinking chars: {c.get('thinkingChars',0)}")
    print("== skill invocations ==")
    for s in stats["skillInvocations"]:
        print(f"  {s['name']}  (line {s['line']})")
    if not stats["skillInvocations"]:
        print("  (none)")
    print("== leading-word adoption (thinking traces): occurrences (blocks) ==")
    for cat in ("discipline", "doctrine", "artifact", "scenery"):
        items = [(w, d) for w, d in stats["leadingWords"].items() if d["category"] == cat]
        if items:
            print(f"  [{cat}] total occurrences {stats['leadingWordCategories'].get(cat,0)}")
            for w, d in sorted(items, key=lambda kv: -kv[1]["occurrences"]):
                print(f"    {w:28s} {d['occurrences']} ({d['blocks']})")
    print("== artifacts ==")
    for label, a in stats["artifacts"].items():
        print(f"  {label}: {a['count']} mention(s)  lines {a['lines'][:8]}")
    print(f"  notebook WRITES (toolCall 'write' to .ai/contexts): {len(stats['artifactWrites'])}")
    for w in stats["artifactWrites"]:
        print(f"    line {w['line']}: {w['call'][:120]}")
    print(f"== gates: {stats['gates']['count']}  lines {stats['gates']['lines'][:12]}")
    print(f"== squawks: {stats['squawks']['count']}  lines {stats['squawks']['lines'][:12]}")
    print(f"== slices mentioned: {stats['slices']['count']}  owed: {stats['owed']['count']}")
def main():
    ap = argparse.ArgumentParser(description="Extract a pi session export for workflow evaluation.")
    ap.add_argument("transcript", help="path to .jsonl or .html pi export")
    ap.add_argument("outdir", nargs="?", help="output dir (default: <transcript>.eval/)")
    args = ap.parse_args()

    path = args.transcript
    if not os.path.exists(path):
        sys.exit(f"extract.py: no such file: {path}")
    outdir = args.outdir or (path + ".eval")
    os.makedirs(outdir, exist_ok=True)
    script_dir = os.path.dirname(os.path.abspath(__file__))

    entries = load_entries(path)
    transcript, think_blocks, block_index = assemble(entries)
    stats = compute_stats(entries, think_blocks, block_index, script_dir)
    stats["input"] = path

    open(os.path.join(outdir, "transcript.txt"), "w").write(transcript)
    open(os.path.join(outdir, "thinking.txt"), "w").write(
        "\n\n".join(f"===== line {s} =====\n{t}" for s, t in think_blocks)
    )
    open(os.path.join(outdir, "stats.json"), "w").write(json.dumps(stats, indent=2))

    print(f"== extracted to {outdir} ==")
    print(f"  transcript.txt ({len(transcript)} chars)  thinking.txt  stats.json")
    print()
    print_summary(stats)

if __name__ == "__main__":
    main()
