import { DomainEvent } from '@/core/events/domain-event'
import { Winner } from '../entities/winner'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export class WinnerDefined implements DomainEvent {
  public occurredAt: Date
  public winners: Winner[]
  public auctionId: UniqueEntityId

  constructor(auctionId: UniqueEntityId, winners: Winner[]) {
    this.auctionId = auctionId
    this.winners = winners
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityId {
    return this.auctionId
  }
}
