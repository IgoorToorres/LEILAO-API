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
import { DomainError } from '@/core/errors/errors/domain-error'
import { describe, it, expect, beforeEach } from 'vitest'
import { ScheduleAuctionUseCase } from '@/domain/auction/application/use-cases/schedule-auction-use-case'

let auctionRepository: InMemoryAuctionRepository
let userRepository: InMemoryUserRepository
let sut: ScheduleAuctionUseCase

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
    title: 'Scheduled Auction',
    description: 'Auction description',
    status: AuctionStatus.scheduled(),
    startAt: new Date(now.getTime() + 60 * 60 * 1000),
    endAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
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

describe('ScheduleAuctionUseCase', () => {
  beforeEach(() => {
    auctionRepository = new InMemoryAuctionRepository()
    userRepository = new InMemoryUserRepository()
    sut = new ScheduleAuctionUseCase(userRepository, auctionRepository)
  })

  it('should return ResourceNotFoundError if user does not exist', async () => {
    const auction = makeDraftAuction([makeLot()])
    await auctionRepository.create(auction)

    const startAt = new Date(Date.now() + 60 * 60 * 1000)
    const endAt = new Date(Date.now() + 2 * 60 * 60 * 1000)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: new UniqueEntityId(),
      startAt,
      endAt,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return NotAllowedError if user is not active', async () => {
    const lot = makeLot()
    const auction = makeDraftAuction([lot])
    const user = makeUser(UserStatus.blocked())

    await userRepository.create(user)
    await auctionRepository.create(auction)

    const startAt = new Date(Date.now() + 60 * 60 * 1000)
    const endAt = new Date(Date.now() + 2 * 60 * 60 * 1000)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
      startAt,
      endAt,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should return ResourceNotFoundError if auction does not exist', async () => {
    const user = makeUser()
    await userRepository.create(user)

    const startAt = new Date(Date.now() + 60 * 60 * 1000)
    const endAt = new Date(Date.now() + 2 * 60 * 60 * 1000)

    const result = await sut.execute({
      auctionId: new UniqueEntityId(),
      userId: user.id,
      startAt,
      endAt,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return DomainError if auction is not draft', async () => {
    const lot = makeLot()
    const auction = makeScheduledAuction(lot)
    const user = makeUser()

    await userRepository.create(user)
    await auctionRepository.create(auction)

    const startAt = new Date(Date.now() + 3 * 60 * 60 * 1000)
    const endAt = new Date(Date.now() + 4 * 60 * 60 * 1000)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
      startAt,
      endAt,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('should return DomainError if auction has no lots', async () => {
    const auction = makeDraftAuction([])
    const user = makeUser()

    await userRepository.create(user)
    await auctionRepository.create(auction)

    const startAt = new Date(Date.now() + 60 * 60 * 1000)
    const endAt = new Date(Date.now() + 2 * 60 * 60 * 1000)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
      startAt,
      endAt,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('should return DomainError if startAt is in the past', async () => {
    const auction = makeDraftAuction([makeLot()])
    const user = makeUser()

    await userRepository.create(user)
    await auctionRepository.create(auction)

    const startAt = new Date(Date.now() - 60 * 1000)
    const endAt = new Date(Date.now() + 60 * 60 * 1000)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
      startAt,
      endAt,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('should return DomainError if endAt is before startAt', async () => {
    const auction = makeDraftAuction([makeLot()])
    const user = makeUser()

    await userRepository.create(user)
    await auctionRepository.create(auction)

    const startAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const endAt = new Date(Date.now() + 60 * 60 * 1000)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
      startAt,
      endAt,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('should be able to schedule a draft auction with lots and valid dates', async () => {
    const auction = makeDraftAuction([makeLot()])
    const user = makeUser()

    await userRepository.create(user)
    await auctionRepository.create(auction)

    const startAt = new Date(Date.now() + 60 * 60 * 1000)
    const endAt = new Date(Date.now() + 2 * 60 * 60 * 1000)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
      startAt,
      endAt,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.auction.status.value).toBe('scheduled')
      expect(result.value.auction.startAt?.getTime()).toBe(startAt.getTime())
      expect(result.value.auction.endAt?.getTime()).toBe(endAt.getTime())
    }
  })
})
