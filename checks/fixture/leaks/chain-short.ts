// Two hops are not a chain: length is the whole of this flag.
export class ShortAccept {
  openShort(certificate: string): void {
    this.next.relayShort(certificate);
  }
}

export class ShortRelay {
  relayShort(certificate: string): void {
    this.next.checkShort(certificate);
  }
}

export class ShortCheck {
  checkShort(certificate: string): boolean {
    const trusted = certificate.length > 0;
    return trusted;
  }
}
