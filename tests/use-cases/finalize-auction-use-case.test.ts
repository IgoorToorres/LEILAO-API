import { InMemoryAuctionRepository } from '../repositories/in-memory-auction-repository'
import { InMemoryPaymentRepository } from '../repositories/in-memory-payment-repository'
import { InMemoryUserRepository } from '../repositories/in-memory-user-repository'
import { FinalizeAuctionUseCase } from '@/domain/auction/application/use-cases/finalize-auction-use-case'
import { Auction } from '@/domain/auction/enterprise/entities/auction'
import { Lot } from '@/domain/auction/enterprise/entities/lot'
import { Money } from '@/domain/auction/enterprise/entities/value-objects/money'
import { AuctionStatus } from '@/domain/auction/enterprise/entities/value-objects/auction/auction-status'
import { PaymentStatus } from '@/domain/auction/enterprise/entities/value-objects/payment/payment-status'
import {
  UserStatus,
  VerificationStatus,
} from '@/domain/auction/enterprise/entities/value-objects/user/user-status'
import { Payment } from '@/domain/auction/enterprise/entities/payment'
import { User } from '@/domain/auction/enterprise/entities/user'
import { Email } from '@/domain/auction/enterprise/entities/value-objects/user/email'
import { BirthDate } from '@/domain/auction/enterprise/entities/value-objects/user/birth-date'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { describe, it, expect, beforeEach } from 'vitest'

let paymentRepository: InMemoryPaymentRepository
let auctionRepository: InMemoryAuctionRepository
let userRepository: InMemoryUserRepository
let sut: FinalizeAuctionUseCase

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

function makeRunningAuction(lot: Lot) {
  const now = new Date()
  return Auction.create({
    title: 'Test Auction',
    description: 'Auction description',
    status: AuctionStatus.running(),
    startAt: new Date(now.getTime() - 60 * 1000),
    endAt: new Date(now.getTime() + 60 * 60 * 1000),
    lots: [lot],
    bids: [],
    minBidIncrementPercentage: 5,
    extensionWindowMinutes: 0,
    createdAt: now,
    updatedAt: now,
  })
}

function makeFinishedAuction() {
  const lot = makeLot()
  const auction = makeRunningAuction(lot)

  auction.placeBid(new UniqueEntityId(), lot.id, Money.create(1500))
  auction.finish()

  return auction
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

function makePayment(
  auctionId: UniqueEntityId,
  status: PaymentStatus,
  amount = 1500,
) {
  const payment = Payment.create({
    auctionId,
    userId: new UniqueEntityId(),
    amount: Money.create(amount),
    status,
  })

  return payment
}

describe('FinalizeAuctionUseCase', () => {
  beforeEach(() => {
    paymentRepository = new InMemoryPaymentRepository()
    auctionRepository = new InMemoryAuctionRepository()
    userRepository = new InMemoryUserRepository()
    sut = new FinalizeAuctionUseCase(
      userRepository,
      auctionRepository,
      paymentRepository,
    )
  })

  it('should return ResourceNotFoundError if user does not exist', async () => {
    const auction = makeFinishedAuction()
    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: new UniqueEntityId(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return NotAllowedError if user is not active', async () => {
    const auction = makeFinishedAuction()
    const user = makeUser(UserStatus.blocked())

    await userRepository.create(user)
    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should return ResourceNotFoundError if auction does not exist', async () => {
    const user = makeUser()
    await userRepository.create(user)

    const result = await sut.execute({
      auctionId: new UniqueEntityId(),
      userId: user.id,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return NotAllowedError if auction is not finished', async () => {
    const user = makeUser()
    const auction = makeRunningAuction(makeLot())

    await userRepository.create(user)
    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should return NotAllowedError if payment does not exist', async () => {
    const user = makeUser()
    const auction = makeFinishedAuction()

    await userRepository.create(user)
    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should return NotAllowedError if payment is not confirmed', async () => {
    const user = makeUser()
    const auction = makeFinishedAuction()
    const payment = makePayment(auction.id, PaymentStatus.pending())

    await userRepository.create(user)
    await auctionRepository.create(auction)
    await paymentRepository.create(payment)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should be able to finalize auction when payment is confirmed', async () => {
    const user = makeUser()
    const auction = makeFinishedAuction()
    const payment = makePayment(auction.id, PaymentStatus.confirmed())

    await userRepository.create(user)
    await auctionRepository.create(auction)
    await paymentRepository.create(payment)

    const result = await sut.execute({
      auctionId: auction.id,
      userId: user.id,
    })

    expect(result.isRight()).toBe(true)
  })
})
