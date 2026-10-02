// Figure 7.3: the third hop.
export class DeliverLayer {
  deliver(certificate: string): void {
    this.next.check(certificate);
  }
}
