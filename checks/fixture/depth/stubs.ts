// Collaborators for book.ts. Kept in their own file so the fixture the test
// scans is only the flawed code: the detector is pinned to book.ts, not to
// this scaffolding.
export type Copyable = { id: string };
export type Context = { threadId: string };

export class TextArea {
  getLastTypedCharacter(): string {
    return this.buffer().slice(-1);
  }

  getCursorOffset(): number {
    return this.buffer().length;
  }

  insertString(textToInsert: string, offset: number): void {
    const head = this.buffer().slice(0, offset);
    const tail = this.buffer().slice(offset);
    this.write(head + textToInsert + tail);
  }

  private storage = "";
  private buffer(): string {
    return this.storage;
  }
  private write(value: string): void {
    this.storage = value;
  }
}

export class TextDocumentListener {
  willInsertString(doc: unknown, text: string, offset: number): void {
    void doc;
    void text;
    void offset;
  }
}

export class ScrollBar {
  static readonly HORIZONTAL = "h";
  static readonly VERTICAL = "v";

  constructor(readonly direction: string) {}
}

export class Panel {
  private readonly children: ScrollBar[] = [];
  add(child: ScrollBar, layout: string): void {
    void layout;
    this.children.push(child);
  }
}

export function getCopy(obj: Copyable): Copyable {
  return { id: obj.id };
}
export function isUnlocked(ptr: Copyable): boolean {
  return ptr.id.length > 0;
}
export function isCopy(ptr: Copyable): boolean {
  return ptr.id.startsWith("copy:");
}
export function getThreadId(ptr: Copyable): string {
  return ptr.id.split(":").pop() ?? "main";
}
export function convert(parameter: unknown, type: string): unknown {
  if (typeof parameter === "number" && type === "string") {
    return String(parameter);
  }
  return parameter;
}
