import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { AuctionRepository } from '../repositories/auction-repository'
import { UserRepository } from '../repositories/user-repository'
import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Auction } from '../../enterprise/entities/auction'
import { DomainEvents } from '@/core/events/domain-events'

interface FinishAuctionUseCaseProps {
  auctionId: UniqueEntityId
  userId: UniqueEntityId
}

type FinishAuctionUseCaseResponse = Either<
  NotAllowedError | ResourceNotFoundError,
  { auction: Auction }
>

export class FinishAuctionUseCase {
  constructor(
    private auctionRepo: AuctionRepository,
    private userRepo: UserRepository,
  ) {}

  async execute({
    auctionId,
    userId,
  }: FinishAuctionUseCaseProps): Promise<FinishAuctionUseCaseResponse> {
    const user = await this.userRepo.findById(userId)

    if (!user) {
      return left(new ResourceNotFoundError())
    }

    if (user.status !== 'active') {
      return left(new NotAllowedError())
    }

    const auction = await this.auctionRepo.findById(auctionId)

    if (!auction) {
      return left(new ResourceNotFoundError())
    }

    try {
      auction.finish()
    } catch (error) {
      console.error(error)
      return left(new NotAllowedError())
    }

    await this.auctionRepo.update(auction)

    DomainEvents.dispatchEventsForAggregate(auction.id)

    return right({
      auction,
    })
  }
}
