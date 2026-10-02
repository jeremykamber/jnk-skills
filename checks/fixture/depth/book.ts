// Ground truth for the depth detector: the flawed examples from John
// Ousterhout, *A Philosophy of Software Design*, transcribed into TypeScript.
//
// Every flaw in this file is one the book names, in its own words, and the
// chapter is named above each block. This file is supposed to be wrong: the
// detector is pinned to it the way checks/test_crap.py is pinned to
// hand-computed CRAP values.
//
// The one-statement methods here are the fixtures. ts-no-tiny-functions does
// not apply to test data whose purpose is to prove a detector fires on it.
import {
  convert,
  type Copyable,
  type Context,
  getCopy,
  getThreadId,
  isCopy,
  isUnlocked,
  Panel,
  ScrollBar,
  TextArea,
  TextDocumentListener,
} from "./stubs";

// ---------------------------------------------------------------------------
// Chapter 4.5 — "Here is an extreme example of a shallow method."
// ---------------------------------------------------------------------------
export class AttributeMap {
  private readonly data = new Map<string, string | null>();

  private addNullValueForAttribute(attribute: string): void {
    this.data.set(attribute, null);
  }
}

// ---------------------------------------------------------------------------
// Chapter 7.1 — pass-through methods. Thirteen of this class's fifteen public
// methods did nothing but forward to TextArea.
// ---------------------------------------------------------------------------
export class TextDocument {
  constructor(
    private readonly textArea: TextArea,
    private readonly listener: TextDocumentListener | null,
  ) {}

  getLastTypedCharacter(): string {
    return this.textArea.getLastTypedCharacter();
  }

  getCursorOffset(): number {
    return this.textArea.getCursorOffset();
  }

  insertString(textToInsert: string, offset: number): void {
    this.textArea.insertString(textToInsert, offset);
  }

  // The one method of the fifteen that had any functionality at all.
  willInsertString(stringToInsert: string, offset: number): void {
    if (this.listener !== null) {
      this.listener.willInsertString(this, stringToInsert, offset);
    }
  }
}

// ---------------------------------------------------------------------------
// Chapter 13.2 — "all of the information in the comment can easily be deduced
// from the code next to the comment."
// ---------------------------------------------------------------------------
export function installScrollBars(container: Panel): void {
  // Add a horizontal scroll bar
  container.add(new ScrollBar(ScrollBar.HORIZONTAL), "south");
  // Add a vertical scroll bar
  container.add(new ScrollBar(ScrollBar.VERTICAL), "east");
}

export function acquireCopy(ctx: Context, obj: Copyable): Copyable | null {
  // Get pointer copy
  const ptrCopy = getCopy(obj);
  if (isUnlocked(ptrCopy)) {
    // return current obj
    return obj;
  }
  if (isCopy(ptrCopy)) {
    // Return obj
    return obj;
  }
  const threadId = getThreadId(ptrCopy);
  // Locked by current ctx — the book's one useful comment in this sample: it
  // names the thread, which the line below does not reveal.
  if (threadId === ctx.threadId) {
    return ptrCopy;
  }
  return null;
}

// The second batch from that chapter: the comment reuses the words of the name
// it documents.

// The horizontal padding of each line in the text.
export const TEXT_HORIZONTAL_PADDING = 4;

// Downcast PARAMETER to TYPE.
export function downcastParameter(parameter: unknown, type: string): unknown {
  const converted = convert(parameter, type);
  if (converted === null) {
    throw new TypeError(`not a ${type}`);
  }
  return converted;
}

// ---------------------------------------------------------------------------
// Chapter 13.5 — the first version of the isReady documentation: the version
// that narrates how the method works.
// ---------------------------------------------------------------------------
export class IndexLookup {
  private resultReady = false;
  private readonly queue: { consumed: boolean; ready: boolean }[] = [];

  /**
   * Check if the next object is RESULT_READY. This function is
   * implemented in a DCFT module, each execution of isReady() tries
   * to make small progress, and getNext() invokes isReady() in a
   * while loop, until isReady() returns true.
   * isReady() is implemented in a rule-based approach. We check
   * different rules by following a particular order, and perform
   * certain actions if some rule is satisfied.
   */
  isReady(): boolean {
    const advanced = this.advance();
    if (advanced) {
      return true;
    }
    return this.resultReady;
  }

  private advance(): boolean {
    const pending = this.queue.filter((object) => !object.consumed);
    if (pending.length === 0) {
      return false;
    }
    this.resultReady = pending[0].ready;
    return this.resultReady;
  }
}
