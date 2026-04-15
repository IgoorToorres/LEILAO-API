import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { PaymentRepository } from '../repositories/payment-repository'
import { AuctionRepository } from '../repositories/auction-repository'
import { UserRepository } from '../repositories/user-repository'
import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { DomainError } from '@/core/errors/errors/domain-error'
import { Auction } from '../../enterprise/entities/auction'
import { DomainEvents } from '@/core/events/domain-events'

interface FinalizeAuctionUseCaseProps {
  auctionId: UniqueEntityId
  userId: UniqueEntityId
}

type FinalizeAuctionUseCaseResponse = Either<
  NotAllowedError | ResourceNotFoundError | DomainError,
  { auction: Auction }
>

export class FinalizeAuctionUseCase {
  constructor(
    private userRepo: UserRepository,
    private auctionRepo: AuctionRepository,
    private paymentRepo: PaymentRepository,
  ) {}

  async execute({
    auctionId,
    userId,
  }: FinalizeAuctionUseCaseProps): Promise<FinalizeAuctionUseCaseResponse> {
    const user = await this.userRepo.findById(userId)
    if (!user) return left(new ResourceNotFoundError())
    if (user.status !== 'active') return left(new NotAllowedError())
    if (user.verificationStatus !== 'approved') {
      return left(new NotAllowedError())
    }

    const auction = await this.auctionRepo.findById(auctionId)
    if (!auction) return left(new ResourceNotFoundError())
    if (auction.status.value !== 'finished') {
      return left(new NotAllowedError())
    }

    const payment = await this.paymentRepo.findByAuctionId(auctionId)
    if (!payment) return left(new NotAllowedError())
    if (payment.status.value !== 'confirmed') return left(new NotAllowedError())

    try {
      auction.finalize()
      await this.auctionRepo.update(auction)
      DomainEvents.dispatchEventsForAggregate(auction.id)
      return right({ auction })
    } catch (error) {
      if (error instanceof Error) {
        return left(new DomainError(error.message))
      }
      return left(new DomainError('Unexpected error'))
    }
  }
}
