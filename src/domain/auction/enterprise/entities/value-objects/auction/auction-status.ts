export type AuctionStatusValue =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'finished'
  | 'finalized'
  | 'canceled'

export class AuctionStatus {
  public value: AuctionStatusValue

  private constructor(value: AuctionStatusValue) {
    this.value = value
  }

  static draft() {
    return new AuctionStatus('draft')
  }

  static scheduled() {
    return new AuctionStatus('scheduled')
  }

  static running() {
    return new AuctionStatus('running')
  }

  static finished() {
    return new AuctionStatus('finished')
  }

  static finalized() {
    return new AuctionStatus('finalized')
  }

  static canceled() {
    return new AuctionStatus('canceled')
  }

  isScheduledOrRunning(): boolean {
    return this.value === 'scheduled' || this.value === 'running'
  }
}
