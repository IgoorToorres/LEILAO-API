import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
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
  ResourceNotFoundError | NotAllowedError,
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

    if (amount <= 0) return left(new NotAllowedError())
    if (externalReference.trim().length === 0)
      return left(new NotAllowedError())

    if (Number.isNaN(paidAt.getTime())) return left(new NotAllowedError())
    if (paidAt.getTime() > Date.now()) return left(new NotAllowedError())

    // Só para manter o input validado/utilizado neste estágio
    if (!['pix', 'credit_card', 'bank_transfer'].includes(method)) {
      return left(new NotAllowedError())
    }

    const payment = await this.paymentRepo.findPendingByAuctionId(auctionId)
    if (!payment) return left(new NotAllowedError())

    // Regra importante: valor pago deve bater com o valor esperado
    if (payment.amount.value !== amount) return left(new NotAllowedError())

    try {
      payment.confirm()

      await this.paymentRepo.update(payment)

      DomainEvents.dispatchEventsForAggregate(payment.id)

      return right({ payment })
    } catch (error) {
      console.error(error)
      return left(new NotAllowedError())
    }
  }
}
