import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Auction } from '../../enterprise/entities/auction'

export interface AuctionRepository {
  create(auction: Auction): Promise<void>
  findById(id: UniqueEntityId): Promise<Auction | null>
  update(auction: Auction): Promise<void>
}
