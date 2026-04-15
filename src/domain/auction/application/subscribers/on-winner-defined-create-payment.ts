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
      void this.createPayments(event).catch(console.error)
    }, WinnerDefined.name)
  }

  private async createPayments(event: WinnerDefined): Promise<void> {
    for (const winner of event.winners) {
      const payment = Payment.create({
        auctionId: event.auctionId,
        userId: winner.userId,
        amount: winner.finalPrice,
        status: PaymentStatus.pending(),
      })

      await this.paymentRepository.create(payment)
    }
  }
}
