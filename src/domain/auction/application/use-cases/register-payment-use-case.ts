import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { DomainError } from '@/core/errors/errors/domain-error'
import { Payment } from '../../enterprise/entities/payment'
import { PaymentRepository } from '../repositories/payment-repository'
import { AuctionRepository } from '../repositories/auction-repository'
import { DomainEvents } from '@/core/events/domain-events'

interface RegisterPaymentUseCaseProps {
  auctionId: UniqueEntityId
  amount: number
  method: 'pix' | 'credit_card' | 'bank_transfer'
  externalReference: string
  paidAt: Date
}

type RegisterPaymentUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError | DomainError,
  { payment: Payment }
>

export class RegisterPaymentUseCase {
  constructor(
    private paymentRepo: PaymentRepository,
    private auctionRepo: AuctionRepository,
  ) {}

  async execute({
    auctionId,
    amount,
    method,
    externalReference,
    paidAt,
  }: RegisterPaymentUseCaseProps): Promise<RegisterPaymentUseCaseResponse> {
    const auction = await this.auctionRepo.findById(auctionId)

    if (!auction) return left(new ResourceNotFoundError())
    if (auction.status.value !== 'finished') return left(new NotAllowedError())

    if (amount <= 0)
      return left(new DomainError('Amount must be greater than 0'))
    if (externalReference.trim().length === 0) {
      return left(new DomainError('External reference is required'))
    }

    if (Number.isNaN(paidAt.getTime())) {
      return left(new DomainError('Invalid payment date'))
    }
    if (paidAt.getTime() > Date.now()) {
      return left(new DomainError('Payment date cannot be in the future'))
    }

    if (!['pix', 'credit_card', 'bank_transfer'].includes(method)) {
      return left(new DomainError('Invalid payment method'))
    }

    const payment = await this.paymentRepo.findPendingByAuctionId(auctionId)
    if (!payment) return left(new NotAllowedError())

    if (payment.amount.value !== amount) {
      return left(
        new DomainError('Payment amount does not match expected value'),
      )
    }

    try {
      payment.confirm()

      await this.paymentRepo.update(payment)

      DomainEvents.dispatchEventsForAggregate(payment.id)

      return right({ payment })
    } catch (error) {
      if (error instanceof Error) {
        return left(new DomainError(error.message))
      }
      return left(new DomainError('Unexpected error'))
    }
  }
}
