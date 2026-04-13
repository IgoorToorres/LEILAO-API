import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { AuctionRepository } from '@/domain/auction/application/repositories/auction-repository'
import { Auction } from '@/domain/auction/enterprise/entities/auction'

export class InMemoryAuctionRepository implements AuctionRepository {
  public items: Auction[] = []

  async create(auction: Auction) {
    this.items.push(auction)
  }

  async findById(id: UniqueEntityId) {
    const auction = this.items.find((item) => item.id.equals(id))

    if (!auction) return null

    return auction
  }

  async update(auction: Auction): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id.equals(auction.id))

    this.items[itemIndex] = auction
  }
}
