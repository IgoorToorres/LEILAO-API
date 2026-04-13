import { DomainEvent } from '@/core/events/domain-event'
import { Winner } from '../entities/winner'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export class WinnerDefined implements DomainEvent {
  public occurredAt: Date
  public winner: Winner

  constructor(winner: Winner) {
    this.winner = winner
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityId {
    return this.winner.id
  }
}
