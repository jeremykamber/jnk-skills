// The other half of the ground truth: the book's own corrected versions of the
// flaws in book.ts. The detector must report *nothing* here. A detector that
// fires on the book's good examples has no authority over the bad ones.

// Chapter 6.3 — the general-purpose, range-oriented text API. Three methods of
// the shallow API collapse into two deep ones, and the interface no longer
// reflects the user interface's features.
type Position = { line: number; column: number };

export class Text {
  private readonly lines: string[] = [];

  /**
   * Insert newText so that it begins at position; positions after it shift by
   * newText.length, and a newline in newText splits a line.
   */
  insert(position: Position, newText: string): void {
    const line = this.lines[position.line];
    const before = line.slice(0, position.column);
    const after = line.slice(position.column);
    const parts = (before + newText + after).split("\n");
    this.lines.splice(position.line, 1, ...parts);
  }

  /**
   * Delete every character at a position greater than or equal to start and
   * less than end. An empty range deletes nothing.
   */
  delete(start: Position, end: Position): void {
    const head = this.slice({ line: 0, column: 0 }, start);
    const tail = this.slice(end, { line: this.lines.length, column: 0 });
    this.replaceAll(head + tail);
  }

  /**
   * The position numChars away from position: negative moves backwards, and
   * the result skips to the previous or next line when it crosses a newline.
   */
  changePosition(position: Position, numChars: number): Position {
    const absolute = this.toOffset(position) + numChars;
    const bounded = Math.min(this.toOffset(this.end()), Math.max(0, absolute));
    if (bounded === absolute) {
      return position;
    }
    return this.toPosition(bounded);
  }

  private slice(start: Position, end: Position): string {
    const from = this.toOffset(start);
    const to = this.toOffset(end);
    return this.lines.join("\n").slice(Math.max(0, from), Math.max(0, to));
  }

  private replaceAll(text: string): void {
    this.lines.length = 0;
    this.lines.push(...text.split("\n"));
  }

  private toOffset(position: Position): number {
    let offset = 0;
    for (let line = 0; line < position.line; line += 1) {
      offset += this.lines[line].length + 1;
    }
    return offset + position.column;
  }

  private toPosition(offset: number): Position {
    let remaining = offset;
    for (let line = 0; line < this.lines.length; line += 1) {
      const width = this.lines[line].length + 1;
      if (remaining < width) {
        return { line, column: remaining };
      }
      remaining -= width;
    }
    return this.end();
  }

  private end(): Position {
    const last = Math.max(0, this.lines.length - 1);
    return { line: last, column: this.lines[last]?.length ?? 0 };
  }
}

// Chapter 13.2 — the book's own revision of the padding comment. Units, and
// the fact that it applies to both sides, are what the first version left out.
// The amount of blank space to leave on the left and right sides of each line
// of text, in pixels.
export const TEXT_HORIZONTAL_PADDING = 4;

// Chapter 5.6 — the deep parameter interface, instead of getParams() handing
// back the map it stores.
export class Request {
  constructor(private readonly params: Map<string, string>) {}

  /**
   * The value of the named parameter, or null if the request does not supply
   * it. The value is URL-decoded, and parameters from the request line and the
   * body are merged, so a caller cannot tell which one supplied it.
   */
  getParameter(name: string): string | null {
    const raw = this.params.get(name);
    if (raw === undefined) {
      return null;
    }
    return decodeURIComponent(raw.replace(/\+/g, " "));
  }

  /**
   * The named parameter parsed as an integer, or null if the request does not
   * supply it or the value is not one.
   */
  getIntParameter(name: string): number | null {
    const raw = this.getParameter(name);
    if (raw === null || !/^-?\d+$/.test(raw)) {
      return null;
    }
    return Number.parseInt(raw, 10);
  }
}

// Chapter 10.3 — the substring the book asks for: the characters in the range
// (if any), with the out-of-range indexes defined out of existence rather than
// thrown.
export function substring(text: string, beginIndex: number, endIndex: number): string {
  const begin = Math.max(0, beginIndex);
  const end = Math.min(text.length, Math.max(endIndex, begin));
  return text.slice(begin, end);
}
