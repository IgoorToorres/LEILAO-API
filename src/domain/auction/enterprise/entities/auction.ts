import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { AuctionStatus } from './value-objects/auction/auction-status'
import { AggregateRoot } from '@/core/entities/aggregate-root'
import { Lot } from './lot'

interface AuctionProps {
  title: string
  description: string
  status: AuctionStatus
  startAt: Date
  endAt: Date
  lots: Lot[]
  createdAt: Date
  updatedAt: Date
}

export class Auction extends AggregateRoot<AuctionProps> {
  static create(props: AuctionProps, id?: UniqueEntityId) {
    if (props.endAt <= props.startAt) {
      throw new Error('endAt must be after startAt')
    }
    if (props.lots.length === 0) {
      throw new Error('Auction must have at least one lot')
    }
    return new Auction(props, id)
  }
}
