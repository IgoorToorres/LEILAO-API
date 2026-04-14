import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { AuctionRepository } from '../repositories/auction-repository'
import { UserRepository } from '../repositories/user-repository'
import { Lot } from '../../enterprise/entities/lot'
import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Auction } from '../../enterprise/entities/auction'
import { AuctionStatus } from '../../enterprise/entities/value-objects/auction/auction-status'

interface CreateAuctionUseCaseProps {
  userId: UniqueEntityId
  title: string
  description: string
  minBidIncrementPercentage: number
  extensionWindowMinutes: number
  lots?: Lot[]
  startAt?: Date
  endAt?: Date
}

type CreateAuctionUseCaseResponse = Either<
  NotAllowedError | ResourceNotFoundError,
  { auction: Auction }
>

export class CreateAuctionUseCase {
  constructor(
    private userRepo: UserRepository,
    private auctionRepo: AuctionRepository,
  ) {}

  async execute({
    title,
    description,
    extensionWindowMinutes,
    lots,
    minBidIncrementPercentage,
    userId,
    startAt,
    endAt,
  }: CreateAuctionUseCaseProps): Promise<CreateAuctionUseCaseResponse> {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      return left(new ResourceNotFoundError())
    }
    if (user.status !== 'active') {
      return left(new NotAllowedError())
    }

    try {
      const auction = Auction.create({
        title,
        description,
        extensionWindowMinutes,
        minBidIncrementPercentage,
        lots: lots ?? [],
        bids: [],
        status: AuctionStatus.draft(),
        startAt,
        endAt,
      })

      await this.auctionRepo.create(auction)

      return right({
        auction,
      })
    } catch (error) {
      console.error(error)
      return left(new NotAllowedError())
    }
  }
}
