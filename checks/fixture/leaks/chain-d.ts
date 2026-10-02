// Figure 7.3: the deep method, where the value is used at last.
export class CheckLayer {
  check(certificate: string): boolean {
    const trusted = certificate.length > 0;
    return trusted;
  }
}
