import { DomainEvent } from '@/core/events/domain-event'
import { Auction } from '../entities/auction'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export class AuctionStarted implements DomainEvent {
  public occurredAt: Date
  public auction: Auction

  constructor(auction: Auction) {
    this.auction = auction
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityId {
    return this.auction.id
  }
}
