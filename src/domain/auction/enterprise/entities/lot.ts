import { Entity } from '@/core/entities/entity'
import { Money } from './value-objects/money'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

interface LotProps {
  title: string
  description?: string
  quantity: number
  startingPrice: Money
  reservePrice?: Money
  createdAt: Date
  updatedAt: Date
}

export class Lot extends Entity<LotProps> {
  static create(props: LotProps, id?: UniqueEntityId) {
    if (props.quantity <= 0) throw new Error('Quantity must be greater than 0')
    if (props.startingPrice.value <= 0) {
      throw new Error('Starting price must be > 0')
    }
    if (Number.isNaN(props.createdAt.getTime())) {
      throw new Error('Invalid createdAt')
    }
    if (Number.isNaN(props.updatedAt.getTime())) {
      throw new Error('Invalid updatedAt')
    }
    if (props.updatedAt < props.createdAt) {
      throw new Error('updatedAt cannot be earlier than createdAt')
    }
    if (
      props.reservePrice &&
      props.reservePrice.value < props.startingPrice.value
    ) {
      throw new Error('Reserve price must be >= starting price')
    }

    return new Lot(props, id)
  }

  get title(): string {
    return this.props.title
  }

  get startingPrice(): Money {
    return this.props.startingPrice
  }

  get reservePrice(): Money | undefined {
    return this.props.reservePrice
  }
}
