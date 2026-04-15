import { DomainEvents } from '@/core/events/domain-events'
import { EventHandler } from '@/core/events/event-handler'
import { WinnerDefined } from '../../enterprise/events/winner-defined'
import { Payment } from '../../enterprise/entities/payment'
import { PaymentStatus } from '../../enterprise/entities/value-objects/payment/payment-status'
import { PaymentRepository } from '../repositories/payment-repository'

export class OnWinnerDefinedCreatePayment implements EventHandler {
  constructor(private paymentRepository: PaymentRepository) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register((event: WinnerDefined) => {
      // eslint-disable-next-line no-void
      void this.createPayment(event)
    }, WinnerDefined.name)
  }

  private async createPayment(event: WinnerDefined): Promise<void> {
    const payment = Payment.create({
      auctionId: event.auctionId,
      userId: event.winner.userId,
      amount: event.winner.finalPrice,
      status: PaymentStatus.pending(),
    })

    await this.paymentRepository.create(payment)
  }
}
