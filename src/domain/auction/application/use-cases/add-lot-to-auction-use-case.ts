import { Either, left, right } from '@/core/either'
import { Lot } from '../../enterprise/entities/lot'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { DomainError } from '@/core/errors/errors/domain-error'
import { Auction } from '../../enterprise/entities/auction'
import { UserRepository } from '../repositories/user-repository'
import { AuctionRepository } from '../repositories/auction-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

interface AddLotToAuctionUseCaseProps {
  auctionId: UniqueEntityId
  userId: UniqueEntityId
  lots: Lot[]
}

type AddLotToAuctionUseCaseResponse = Either<
  NotAllowedError | ResourceNotFoundError | DomainError,
  { auction: Auction }
>

export class AddLotToAuctionUseCase {
  constructor(
    private userRepo: UserRepository,
    private auctionRepo: AuctionRepository,
  ) {}

  async execute({
    auctionId,
    userId,
    lots,
  }: AddLotToAuctionUseCaseProps): Promise<AddLotToAuctionUseCaseResponse> {
    const user = await this.userRepo.findById(userId)
    if (!user) return left(new ResourceNotFoundError())
    if (user.status !== 'active') return left(new NotAllowedError())
    if (user.verificationStatus !== 'approved') {
      return left(new NotAllowedError())
    }
    const auction = await this.auctionRepo.findById(auctionId)
    if (!auction) return left(new ResourceNotFoundError())
    if (lots.length === 0) return left(new NotAllowedError())

    try {
      auction.addLots(lots)
      await this.auctionRepo.update(auction)
      return right({ auction })
    } catch (error) {
      if (error instanceof Error) {
        return left(new DomainError(error.message))
      }
      return left(new DomainError('Unexpected error'))
    }
  }
}
