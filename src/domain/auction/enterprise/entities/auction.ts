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
  startAt: Date
  endAt: Date
  lots: Lot[]
  bids: Bid[]
  minBidIncrementPercentage: number
  extensionWindowMinutes: number
  createdAt: Date
  updatedAt: Date
}

export class Auction extends AggregateRoot<AuctionProps> {
  static create(props: AuctionProps, id?: UniqueEntityId) {
    const now = new Date()

    const auction = new Auction(
      {
        ...props,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    )

    if (Number.isNaN(props.startAt.getTime())) {
      throw new Error('Invalid startAt')
    }
    if (Number.isNaN(props.endAt.getTime())) {
      throw new Error('Invalid endAt')
    }
    if (props.endAt <= props.startAt) {
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
      throw new Error('Bid amount is too low')
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

    const bestBid = this.props.bids[this.props.bids.length - 1]
    if (!bestBid) {
      throw new Error('Cannot close auction without bids')
    }

    const winner = Winner.create({
      auctionId: this.id,
      bidId: bestBid.id,
      finalPrice: bestBid.amount,
      userId: bestBid.userId,
    })

    this.props.status = AuctionStatus.finished()
    this.props.updatedAt = new Date()

    this.addDomainEvent(new WinnerDefined(this.id, winner))
    this.addDomainEvent(new AuctionFinished(this))
  }
}
