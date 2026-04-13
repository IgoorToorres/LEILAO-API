export type AuctionStatusValue =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'finished'
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

  static canceled() {
    return new AuctionStatus('canceled')
  }
}
