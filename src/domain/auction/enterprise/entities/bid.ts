import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Money } from './value-objects/money'
import { Entity } from '@/core/entities/entity'

interface BidProps {
  auctionId: UniqueEntityId
  lotId: UniqueEntityId
  userId: UniqueEntityId
  amount: Money
  createdAt: Date
}

export class Bid extends Entity<BidProps> {
  static create(
    props: Omit<BidProps, 'createdAt'> & Partial<Pick<BidProps, 'createdAt'>>,
    id?: UniqueEntityId,
  ) {
    if (props.amount.value <= 0) {
      throw new Error('Bid amount must be > 0')
    }
    if (!props.auctionId || !props.lotId || !props.userId) {
      throw new Error('Bid must have auctionId, lotId and userId')
    }

    const createdAt = props.createdAt ?? new Date()

    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid createdAt')
    }

    return new Bid(
      {
        ...props,
        createdAt,
      },
      id,
    )
  }

  get amount(): Money {
    return this.props.amount
  }

  get lotId(): UniqueEntityId {
    return this.props.lotId
  }
}
