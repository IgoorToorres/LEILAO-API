import { DomainEvent } from '@/core/events/domain-event'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Bid } from '../entities/bid'

export class BidOutbid implements DomainEvent {
  public occurredAt: Date
  public bid: Bid
  public auctionId: UniqueEntityId

  constructor(auctionId: UniqueEntityId, bid: Bid) {
    this.auctionId = auctionId
    this.bid = bid
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityId {
    return this.auctionId
  }
}
