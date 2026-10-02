// Figure 5.1: the reader declares the layout it expects to find.
export interface FileHeader {
  type: string;
  length: number;
  checksum: string;
  name: string;
}

export function readHeader(bytes: string): string {
  const fields = bytes.split(",");
  return `${fields[0]} ${fields[1]}`;
}
