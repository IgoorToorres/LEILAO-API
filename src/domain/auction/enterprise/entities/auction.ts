import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { AuctionStatus } from './value-objects/auction/auction-status'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { Lot } from './lot'
import { Bid } from './bid'
import { Money } from './value-objects/money'

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

    if (props.endAt <= props.startAt) {
      throw new Error('endAt must be after startAt')
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

    const incrementValue = Math.ceil(
      (referenceAmount * this.props.minBidIncrementPercentage) / 100,
    )
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

    if (this.props.extensionWindowMinutes > 0) {
      const windowMs = this.props.extensionWindowMinutes * 60 * 1000
      if (now.getTime() >= this.props.endAt.getTime() - windowMs) {
        this.props.endAt = new Date(this.props.endAt.getTime() + windowMs)
      }
    }

    this.props.updatedAt = now
  }
}
