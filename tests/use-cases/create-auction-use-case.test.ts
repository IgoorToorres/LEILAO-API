import { InMemoryAuctionRepository } from '../repositories/in-memory-auction-repository'
import { InMemoryUserRepository } from '../repositories/in-memory-user-repository'
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
import { CreateAuctionUseCase } from '@/domain/auction/application/use-cases/create-auction-use-case'

let auctionRepository: InMemoryAuctionRepository
let userRepository: InMemoryUserRepository
let sut: CreateAuctionUseCase

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

describe('CreateAuctionUseCase', () => {
  beforeEach(() => {
    auctionRepository = new InMemoryAuctionRepository()
    userRepository = new InMemoryUserRepository()
    sut = new CreateAuctionUseCase(userRepository, auctionRepository)
  })

  it('should return ResourceNotFoundError if user does not exist', async () => {
    const result = await sut.execute({
      userId: new UniqueEntityId(),
      title: 'Auction',
      description: 'Auction description',
      minBidIncrementPercentage: 5,
      extensionWindowMinutes: 0,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return NotAllowedError if user is not active', async () => {
    const user = makeUser(UserStatus.blocked())
    await userRepository.create(user)

    const result = await sut.execute({
      userId: user.id,
      title: 'Auction',
      description: 'Auction description',
      minBidIncrementPercentage: 5,
      extensionWindowMinutes: 0,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should be able to create an auction in draft', async () => {
    const user = makeUser()
    await userRepository.create(user)

    const result = await sut.execute({
      userId: user.id,
      title: 'Auction',
      description: 'Auction description',
      minBidIncrementPercentage: 5,
      extensionWindowMinutes: 0,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.auction.status.value).toBe('draft')
    }
  })

  it('should allow creating draft auction without lots', async () => {
    const user = makeUser()
    await userRepository.create(user)

    const result = await sut.execute({
      userId: user.id,
      title: 'Auction',
      description: 'Auction description',
      minBidIncrementPercentage: 5,
      extensionWindowMinutes: 0,
    })

    expect(result.isRight()).toBe(true)
  })

  it('should return DomainError if minBidIncrementPercentage is negative', async () => {
    const user = makeUser()
    await userRepository.create(user)

    const result = await sut.execute({
      userId: user.id,
      title: 'Auction',
      description: 'Auction description',
      minBidIncrementPercentage: -1,
      extensionWindowMinutes: 0,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('should return DomainError if extensionWindowMinutes is negative', async () => {
    const user = makeUser()
    await userRepository.create(user)

    const result = await sut.execute({
      userId: user.id,
      title: 'Auction',
      description: 'Auction description',
      minBidIncrementPercentage: 5,
      extensionWindowMinutes: -1,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('should return DomainError if startAt/endAt are invalid when provided', async () => {
    const user = makeUser()
    await userRepository.create(user)

    const invalidDate = new Date('invalid-date')

    const result = await sut.execute({
      userId: user.id,
      title: 'Auction',
      description: 'Auction description',
      minBidIncrementPercentage: 5,
      extensionWindowMinutes: 0,
      startAt: invalidDate,
      endAt: invalidDate,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('should return DomainError if endAt is before startAt when provided', async () => {
    const user = makeUser()
    await userRepository.create(user)

    const startAt = new Date(Date.now() + 60 * 60 * 1000)
    const endAt = new Date(Date.now() + 30 * 60 * 1000)

    const result = await sut.execute({
      userId: user.id,
      title: 'Auction',
      description: 'Auction description',
      minBidIncrementPercentage: 5,
      extensionWindowMinutes: 0,
      startAt,
      endAt,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('should allow creating auction in draft even with startAt/endAt in the future', async () => {
    const user = makeUser()
    await userRepository.create(user)

    const startAt = new Date(Date.now() + 60 * 60 * 1000)
    const endAt = new Date(Date.now() + 2 * 60 * 60 * 1000)

    const result = await sut.execute({
      userId: user.id,
      title: 'Auction',
      description: 'Auction description',
      minBidIncrementPercentage: 5,
      extensionWindowMinutes: 0,
      startAt,
      endAt,
    })

    expect(result.isRight()).toBe(true)
  })

  it('should allow creating draft auction with lots', async () => {
    const user = makeUser()
    await userRepository.create(user)

    const lot = makeLot()

    const result = await sut.execute({
      userId: user.id,
      title: 'Auction',
      description: 'Auction description',
      minBidIncrementPercentage: 5,
      extensionWindowMinutes: 0,
      lots: [lot],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.auction.status.value).toBe('draft')
    }
  })
})
