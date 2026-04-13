import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Money } from './value-objects/money'
import { PaymentStatus } from './value-objects/payment/payment-status'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { PaymentConfirmed } from '../events/payment-confirmed'

interface PaymentProps {
  auctionId: UniqueEntityId
  userId: UniqueEntityId
  amount: Money
  status: PaymentStatus
  createdAt: Date
  updatedAt: Date
}

export class Payment extends AggregateRoot<PaymentProps> {
  static create(
    props: Omit<PaymentProps, 'createdAt' | 'updatedAt'> &
      Partial<Pick<PaymentProps, 'createdAt' | 'updatedAt'>>,
    id?: UniqueEntityId,
  ) {
    if (props.amount.value <= 0) {
      throw new Error('Amount must be greater than 0')
    }

    const now = new Date()
    const createdAt = props.createdAt ?? now
    const updatedAt = props.updatedAt ?? now

    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid createdAt')
    }
    if (Number.isNaN(updatedAt.getTime())) {
      throw new Error('invalid updatedAt')
    }
    if (updatedAt < createdAt) {
      throw new Error('updatedAt cannot be earlier than createdAt')
    }

    return new Payment(
      {
        ...props,
        createdAt,
        updatedAt,
      },
      id,
    )
  }

  public confirm() {
    if (this.props.status.value !== 'pending') {
      throw new Error('Payment must be pending to confirm')
    }

    this.props.status = PaymentStatus.confirmed()
    this.props.updatedAt = new Date()

    this.addDomainEvent(new PaymentConfirmed(this))
  }
}
