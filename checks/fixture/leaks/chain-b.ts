// Figure 7.3: the second hop, which also only hands it on.
export class RelayLayer {
  relay(certificate: string): void {
    this.next.deliver(certificate);
  }
}
