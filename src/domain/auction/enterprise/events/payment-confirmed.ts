import { DomainEvent } from '@/core/events/domain-event'
import { Payment } from '../entities/payment'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export class PaymentConfirmed implements DomainEvent {
  public occurredAt: Date
  public payment: Payment

  constructor(payment: Payment) {
    this.payment = payment
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityId {
    return this.payment.id
  }
}
