// Figure 5.1: the writer declares the same layout, independently.
export interface FileHeader {
  type: string;
  length: number;
  checksum: string;
  name: string;
}

// Three of the four fields, plus two of its own: not the same shape written
// twice, so this must not be reported alongside the pair above.
export interface WriteStats {
  type: string;
  length: number;
  checksum: string;
  writtenAt: number;
  retries: number;
}

export function writeHeader(header: FileHeader): string {
  const fields = [header.type, header.length, header.checksum, header.name];
  return fields.join(",");
}
