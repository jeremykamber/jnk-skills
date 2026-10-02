// Chapter 4.6: an interface with one implementation is an indirection. The
// second interface here has two, which is a seam, so it is not reported.
export interface Store {
  put(key: string, value: string): void;
}

export interface Sink {
  write(line: string): void;
}

export class MemoryStore implements Store {
  put(key: string, value: string): void {
    this.entries.set(key, value);
  }

  private readonly entries = new Map<string, string>();
}

export class FileSink implements Sink {
  write(line: string): void {
    this.lines.push(line);
  }

  private readonly lines: string[] = [];
}

export class NullSink implements Sink {
  write(line: string): void {
    const ignored = line;
    void ignored;
  }
}
