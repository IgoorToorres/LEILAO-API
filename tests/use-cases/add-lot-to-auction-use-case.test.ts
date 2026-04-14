import { InMemoryAuctionRepository } from '../repositories/in-memory-auction-repository'
import { InMemoryUserRepository } from '../repositories/in-memory-user-repository'
import { AuctionStatus } from '@/domain/auction/enterprise/entities/value-objects/auction/auction-status'
import { Auction } from '@/domain/auction/enterprise/entities/auction'
import { Lot } from '@/domain/auction/enterprise/entities/lot'
import {
  UserStatus,
  VerificationStatus,
} from '@/domain/auction/enterprise/entities/value-objects/user/user-status'
import { User } from '@/domain/auction/enterprise/entities/user'
import { Email } from '@/domain/auction/enterprise/entities/value-objects/user/email'
import { BirthDate } from '@/domain/auction/enterprise/entities/value-objects/user/birth-date'
import { Money } from '@/domain/auction/enterprise/entities/value-objects/money'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { describe, it, expect, beforeEach } from 'vitest'
import { AddLotToAuctionUseCase } from '@/domain/auction/application/use-cases/add-lot-to-auction-use-case'

let auctionRepository: InMemoryAuctionRepository
let userRepository: InMemoryUserRepository
let sut: AddLotToAuctionUseCase

function makeLot() {
  const now = new Date()
  return Lot.create({
    title: 'Test Lot',
    description: 'Lot description',
    quantity: 1,
    startingPrice: Money.create(1000),
    createdAt: now,
    updatedAt: now,
  })
}

function makeDraftAuction(lots: Lot[] = []) {
  return Auction.create({
    title: 'Test Auction',
    description: 'Auction description',
    status: AuctionStatus.draft(),
    lots,
    bids: [],
    minBidIncrementPercentage: 5,
    extensionWindowMinutes: 0,
  })
}

function makeScheduledAuction(lot: Lot) {
  const now = new Date()
  return Auction.create({
    title: 'Test Auction',
    description: 'Auction description',
    status: AuctionStatus.scheduled(),
    startAt: new Date(now.getTime() + 60 * 1000),
    endAt: new Date(now.getTime() + 60 * 60 * 1000),
    lots: [lot],
    bids: [],
    minBidIncrementPercentage: 5,
    extensionWindowMinutes: 0,
  })
}

function makeUser(
  status: UserStatus = UserStatus.active(),
  verificationStatus: VerificationStatus = VerificationStatus.approved(),
) {
  const now = new Date()
  return User.create({
    name: 'Test User',
    email: Email.create('test@example.com'),
    birthDate: BirthDate.createFromDate(new Date(1990, 1, 1)),
    status,
    verificationStatus,
    createdAt: now,
    updatedAt: now,
  })
}

describe('AddLotToAuction', () => {
  beforeEach(() => {
    auctionRepository = new InMemoryAuctionRepository()
    userRepository = new InMemoryUserRepository()
    sut = new AddLotToAuctionUseCase(userRepository, auctionRepository)
  })

  it('should return ResourceNotFoundError if user does not exist', async () => {
    const auction = makeDraftAuction()
    const lot = makeLot()

    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: new UniqueEntityId(),
      lots: [lot],
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return NotAllowedError if user is not active', async () => {
    const auction = makeDraftAuction()
    const lot = makeLot()
    const user = makeUser(UserStatus.blocked())

    await userRepository.create(user)
    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
      lots: [lot],
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should return ResourceNotFoundError if auction does not exist', async () => {
    const user = makeUser()
    const lot = makeLot()

    await userRepository.create(user)

    const result = await sut.execute({
      auctionId: new UniqueEntityId(),
      userId: user.id,
      lots: [lot],
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return NotAllowedError if auction is not draft', async () => {
    const lot = makeLot()
    const auction = makeScheduledAuction(lot)
    const user = makeUser()

    await userRepository.create(user)
    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
      lots: [makeLot()],
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should be able to add lot to draft auction', async () => {
    const auction = makeDraftAuction()
    const user = makeUser()
    const lot = makeLot()

    await userRepository.create(user)
    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
      lots: [lot],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.value.auction as any).props.lots.length).toBe(1)
    }
  })
})
