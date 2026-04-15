import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { AuctionStatus } from './value-objects/auction/auction-status'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { Lot } from './lot'
import { Bid } from './bid'
import { Money } from './value-objects/money'
import { BidOutbid } from '../events/bid-outbid'
import { AuctionFinished } from '../events/auction-finished'
import { AuctionStarted } from '../events/auction-started'
import { Winner } from './winner'
import { WinnerDefined } from '../events/winner-defined'

interface AuctionProps {
  title: string
  description: string
  status: AuctionStatus
  startAt?: Date
  endAt?: Date
  lots: Lot[]
  bids: Bid[]
  winners: Winner[]
  minBidIncrementPercentage: number
  extensionWindowMinutes: number
  createdAt: Date
  updatedAt: Date
}

export class Auction extends AggregateRoot<AuctionProps> {
  get title(): string {
    return this.props.title
  }

  get description(): string {
    return this.props.description
  }

  get status(): AuctionStatus {
    return this.props.status
  }

  get startAt(): Date | undefined {
    return this.props.startAt
  }

  get endAt(): Date | undefined {
    return this.props.endAt
  }

  get lots(): Lot[] {
    return this.props.lots
  }

  get bids(): Bid[] {
    return this.props.bids
  }

  get winners(): Winner[] {
    return this.props.winners
  }

  get minBidIncrementPercentage(): number {
    return this.props.minBidIncrementPercentage
  }

  get extensionWindowMinutes(): number {
    return this.props.extensionWindowMinutes
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  static create(
    props: Omit<AuctionProps, 'createdAt' | 'updatedAt' | 'winners'> &
      Partial<Pick<AuctionProps, 'createdAt' | 'updatedAt' | 'winners'>>,
    id?: UniqueEntityId,
  ) {
    const now = new Date()

    const auction = new Auction(
      {
        ...props,
        winners: props.winners ?? [],
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    )

    Auction.validateTitle(props.title)
    Auction.validateDescription(props.description)

    if (props.startAt) Auction.validateDate(props.startAt)
    if (props.endAt) Auction.validateDate(props.endAt)

    if (props.startAt && props.endAt && props.endAt <= props.startAt) {
      throw new Error('endAt must be after startAt')
    }
    if (props.minBidIncrementPercentage < 0) {
      throw new Error('minBidIncrementPercentage must be >= 0')
    }
    if (props.extensionWindowMinutes < 0) {
      throw new Error('extensionWindowMinutes must be >= 0')
    }
    if (
      auction.props.status.isScheduledOrRunning() &&
      auction.props.lots.length === 0
    ) {
      throw new Error('Auction must have at least one lot')
    }
    if (
      auction.props.status.isScheduledOrRunning() &&
      (!auction.props.startAt || !auction.props.endAt)
    ) {
      throw new Error(
        'startAt and endAt are required when auction is scheduled or running',
      )
    }

    return auction
  }

  public placeBid(
    userId: UniqueEntityId,
    lotId: UniqueEntityId,
    amount: Money,
  ) {
    const now = new Date()

    if (this.props.status.value !== 'running') {
      throw new Error('Auction must be running')
    }
    if (!this.props.startAt || !this.props.endAt) {
      throw new Error('Auction must have startAt and endAt')
    }
    if (now < this.props.startAt || now > this.props.endAt) {
      throw new Error('Bid is outside auction time window')
    }

    const lot = this.props.lots.find((lot) => lot.id.equals(lotId))
    if (!lot) {
      throw new Error('Lot not found in this auction')
    }

    const lastBidForLot = [...this.props.bids]
      .reverse()
      .find((bid) => bid.lotId.equals(lotId))

    const referenceAmount = lastBidForLot
      ? lastBidForLot.amount.value
      : lot.startingPrice.value

    const incrementValue = lastBidForLot
      ? Math.ceil(
          (referenceAmount * this.props.minBidIncrementPercentage) / 100,
        )
      : 0
    const minRequiredAmount = referenceAmount + incrementValue

    if (amount.value < minRequiredAmount) {
      throw new Error(
        `Bid amount is too low. Minimum required: ${minRequiredAmount}`,
      )
    }

    const bid = Bid.create({
      amount,
      auctionId: this.id,
      lotId,
      userId,
    })

    this.props.bids.push(bid)

    if (lastBidForLot) {
      this.addDomainEvent(new BidOutbid(this.id, lastBidForLot))
    }

    if (this.props.extensionWindowMinutes > 0) {
      const windowMs = this.props.extensionWindowMinutes * 60 * 1000
      if (now.getTime() >= this.props.endAt.getTime() - windowMs) {
        this.props.endAt = new Date(this.props.endAt.getTime() + windowMs)
      }
    }

    this.props.updatedAt = now
  }

  public start() {
    if (this.props.status.value !== 'scheduled') {
      throw new Error('Auction must be scheduled to start')
    }
    if (!this.props.startAt) {
      throw new Error('startAt is required to start auction')
    }

    const now = new Date()
    if (now < this.props.startAt) {
      throw new Error('Auction cannot start before startAt')
    }

    this.props.status = AuctionStatus.running()
    this.props.updatedAt = new Date()

    this.addDomainEvent(new AuctionStarted(this))
  }

  public finish() {
    if (this.props.status.value !== 'running') {
      throw new Error('Auction must be running')
    }

    const winners: Winner[] = []

    for (const lot of this.props.lots) {
      const bidsForLot = this.props.bids.filter((bid) =>
        bid.lotId.equals(lot.id),
      )

      if (bidsForLot.length === 0) continue

      const bestBid = bidsForLot[bidsForLot.length - 1]

      if (
        lot.reservePrice &&
        bestBid.amount.value < lot.reservePrice.value
      ) {
        continue
      }

      winners.push(
        Winner.create({
          auctionId: this.id,
          lotId: lot.id,
          bidId: bestBid.id,
          finalPrice: bestBid.amount,
          userId: bestBid.userId,
        }),
      )
    }

    if (winners.length === 0) {
      throw new Error(
        'Cannot finish auction without at least one winning bid',
      )
    }

    this.props.winners = winners
    this.props.status = AuctionStatus.finished()
    this.props.updatedAt = new Date()

    this.addDomainEvent(new WinnerDefined(this.id, winners))
    this.addDomainEvent(new AuctionFinished(this))
  }

  public schedule(startAt: Date, endAt: Date): void {
    if (this.props.status.value !== 'draft') {
      throw new Error('Auction must be in draft')
    }

    if (this.props.lots.length === 0) {
      throw new Error('Auction must have at least one lot')
    }

    Auction.validateDate(startAt)
    Auction.validateDate(endAt)

    const now = new Date()

    if (startAt <= now) {
      throw new Error('startAt must be in the future')
    }

    if (endAt <= startAt) {
      throw new Error('endAt must be after startAt')
    }

    this.props.startAt = startAt
    this.props.endAt = endAt
    this.props.status = AuctionStatus.scheduled()
    this.props.updatedAt = new Date()
  }

  public addLot(lot: Lot): void {
    if (this.props.status.value !== 'draft') {
      throw new Error('Auction must be in draft to add lot')
    }
    const alreadyExists = this.props.lots.some((item) => item.id.equals(lot.id))
    if (alreadyExists) {
      throw new Error('Lot already exists in this auction')
    }

    this.props.lots.push(lot)
    this.props.updatedAt = new Date()
  }

  public finalize(): void {
    if (this.props.status.value !== 'finished') {
      throw new Error('Auction must be finished to finalize')
    }

    this.props.status = AuctionStatus.finalized()
    this.props.updatedAt = new Date()
  }

  public addLots(lots: Lot[]): void {
    for (const lot of lots) {
      this.addLot(lot)
    }
  }

  private static validateTitle(title: string): void {
    if (title.trim().length === 0) {
      throw new Error('Invalid title')
    }
  }

  private static validateDescription(description: string): void {
    if (description.trim().length === 0) {
      throw new Error('Invalid description')
    }
  }

  private static validateDate(date: Date): void {
    if (date && Number.isNaN(date.getTime())) {
      throw new Error('Invalid date')
    }
  }
}
