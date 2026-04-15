import { InMemoryAuctionRepository } from '../repositories/in-memory-auction-repository'
import { InMemoryPaymentRepository } from '../repositories/in-memory-payment-repository'
import { RegisterPaymentUseCase } from '@/domain/auction/application/use-cases/register-payment-use-case'
import { Auction } from '@/domain/auction/enterprise/entities/auction'
import { Lot } from '@/domain/auction/enterprise/entities/lot'
import { Money } from '@/domain/auction/enterprise/entities/value-objects/money'
import { AuctionStatus } from '@/domain/auction/enterprise/entities/value-objects/auction/auction-status'
import { PaymentStatus } from '@/domain/auction/enterprise/entities/value-objects/payment/payment-status'
import { Payment } from '@/domain/auction/enterprise/entities/payment'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { DomainError } from '@/core/errors/errors/domain-error'
import { describe, it, expect, beforeEach } from 'vitest'

let paymentRepository: InMemoryPaymentRepository
let auctionRepository: InMemoryAuctionRepository
let sut: RegisterPaymentUseCase

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

function makePendingPayment(auctionId: UniqueEntityId, amount: number) {
  return Payment.create({
    auctionId,
    userId: new UniqueEntityId(),
    amount: Money.create(amount),
    status: PaymentStatus.pending(),
  })
}

describe('RegisterPaymentUseCase', () => {
  beforeEach(() => {
    paymentRepository = new InMemoryPaymentRepository()
    auctionRepository = new InMemoryAuctionRepository()
    sut = new RegisterPaymentUseCase(paymentRepository, auctionRepository)
  })

  it('should return ResourceNotFoundError if auction does not exist', async () => {
    const result = await sut.execute({
      auctionId: new UniqueEntityId(),
      amount: 1500,
      method: 'pix',
      externalReference: 'pix-tx-123',
      paidAt: new Date(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    }
  })

  it('should return NotAllowedError if auction is not finished', async () => {
    const lot = makeLot()
    const auction = makeRunningAuction(lot)

    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      amount: 1500,
      method: 'pix',
      externalReference: 'pix-tx-123',
      paidAt: new Date(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should return DomainError if amount is less than or equal to zero', async () => {
    const auction = makeFinishedAuction()

    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      amount: 0,
      method: 'pix',
      externalReference: 'pix-tx-123',
      paidAt: new Date(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('should return DomainError if externalReference is empty', async () => {
    const auction = makeFinishedAuction()

    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      amount: 1500,
      method: 'pix',
      externalReference: '   ',
      paidAt: new Date(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('should return DomainError if paidAt is invalid', async () => {
    const auction = makeFinishedAuction()

    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      amount: 1500,
      method: 'pix',
      externalReference: 'pix-tx-123',
      paidAt: new Date('invalid-date'),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('should return DomainError if paidAt is in the future', async () => {
    const auction = makeFinishedAuction()
    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      amount: 1500,
      method: 'pix',
      externalReference: 'pix-tx-123',
      paidAt: new Date(Date.now() + 60 * 1000),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('should return NotAllowedError if there is no pending payment for auction', async () => {
    const auction = makeFinishedAuction()
    await auctionRepository.create(auction)

    const result = await sut.execute({
      auctionId: auction.id,
      amount: 1500,
      method: 'pix',
      externalReference: 'pix-tx-123',
      paidAt: new Date(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError)
    }
  })

  it('should return DomainError if paid amount does not match expected payment amount', async () => {
    const auction = makeFinishedAuction()
    await auctionRepository.create(auction)
    await paymentRepository.create(makePendingPayment(auction.id, 1500))

    const result = await sut.execute({
      auctionId: auction.id,
      amount: 1600,
      method: 'pix',
      externalReference: 'pix-tx-123',
      paidAt: new Date(),
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('should be able to register payment for a finished auction', async () => {
    const auction = makeFinishedAuction()

    await auctionRepository.create(auction)
    await paymentRepository.create(makePendingPayment(auction.id, 1500))

    const result = await sut.execute({
      auctionId: auction.id,
      amount: 1500,
      method: 'pix',
      externalReference: 'pix-tx-123',
      paidAt: new Date(),
    })

    expect(result.isRight()).toBe(true)
    expect(paymentRepository.items).toHaveLength(1)
    expect(paymentRepository.items[0].status.value).toBe('confirmed')
  })
})
