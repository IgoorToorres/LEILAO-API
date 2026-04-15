import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { AuctionRepository } from '../repositories/auction-repository'
import { UserRepository } from '../repositories/user-repository'
import { Money } from '../../enterprise/entities/value-objects/money'
import { Auction } from '../../enterprise/entities/auction'
import { DomainEvents } from '@/core/events/domain-events'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { DomainError } from '@/core/errors/errors/domain-error'

interface PlaceBidUseCaseProps {
  auctionId: UniqueEntityId
  userId: UniqueEntityId
  lotId: UniqueEntityId
  amount: number
}

type PlaceBidUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError | DomainError,
  { auction: Auction }
>

export class PlaceBidUseCase {
  constructor(
    private userRepository: UserRepository,
    private auctionRepository: AuctionRepository,
  ) {}

  async execute({
    auctionId,
    userId,
    amount,
    lotId,
  }: PlaceBidUseCaseProps): Promise<PlaceBidUseCaseResponse> {
    const user = await this.userRepository.findById(userId)

    if (!user) {
      return left(new ResourceNotFoundError())
    }

    if (user.status !== 'active') {
      return left(new NotAllowedError())
    }

    if (user.verificationStatus !== 'approved') {
      return left(new NotAllowedError())
    }

    const auction = await this.auctionRepository.findById(auctionId)

    if (!auction) {
      return left(new ResourceNotFoundError())
    }

    try {
      const bidAmount = Money.create(amount)

      auction.placeBid(userId, lotId, bidAmount)

      await this.auctionRepository.update(auction)

      DomainEvents.dispatchEventsForAggregate(auction.id)

      return right({
        auction,
      })
    } catch (error) {
      if (error instanceof Error) {
        return left(new DomainError(error.message))
      }
      return left(new DomainError('Unexpected error'))
    }
  }
}
