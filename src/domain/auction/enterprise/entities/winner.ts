import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Money } from './value-objects/money'
import { Entity } from '@/core/entities/entity'

interface WinnerProps {
  auctionId: UniqueEntityId
  lotId: UniqueEntityId
  userId: UniqueEntityId
  bidId: UniqueEntityId
  finalPrice: Money
  createdAt: Date
}

export class Winner extends Entity<WinnerProps> {
  static create(
    props: Omit<WinnerProps, 'createdAt'> &
      Partial<Pick<WinnerProps, 'createdAt'>>,
    id?: UniqueEntityId,
  ) {
    if (!props.auctionId || !props.lotId || !props.userId || !props.bidId) {
      throw new Error('Winner must have auctionId, lotId, userId and bidId')
    }

    const now = new Date()
    const createdAt = props.createdAt ?? now

    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid createdAt')
    }

    if (props.finalPrice.value <= 0) {
      throw new Error('Final price must be > 0')
    }

    const winner = new Winner(
      {
        ...props,
        createdAt,
      },
      id,
    )

    return winner
  }

  get auctionId(): UniqueEntityId {
    return this.props.auctionId
  }

  get lotId(): UniqueEntityId {
    return this.props.lotId
  }

  get userId(): UniqueEntityId {
    return this.props.userId
  }

  get bidId(): UniqueEntityId {
    return this.props.bidId
  }

  get finalPrice(): Money {
    return this.props.finalPrice
  }
}
