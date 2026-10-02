// Chapter 9.8: the method does two things. The run of statements in the middle
// touches no instance state, so it is the part that can leave.
export class ReportWriter {
  render(rows: string[]): string {
    const heading = "report";
    const separator = "-";
    const width = rows.length;
    return `${heading} ${separator} ${width} ${this.format(rows)}`;
  }

  private format(rows: string[]): string {
    const joined = rows.join(",");
    const trimmed = joined.trim();
    const upper = trimmed.toUpperCase();
    return `${upper}${this.suffix()}`;
  }

  private suffix(): string {
    return ".";
  }
}
