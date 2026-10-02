// Figure 7.3: the parameter enters here and is handed on.
export class AcceptLayer {
  open(certificate: string): void {
    this.next.relay(certificate);
  }
}
