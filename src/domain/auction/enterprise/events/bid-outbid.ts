import { DomainEvent } from '@/core/events/domain-event'
import { Bid } from '../entities/bid'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export class BidOutbid implements DomainEvent {
  public occurredAt: Date
  public bid: Bid

  constructor(bid: Bid) {
    this.bid = bid
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityId {
    return this.bid.id
  }
}
