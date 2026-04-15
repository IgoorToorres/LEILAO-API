import { PaymentRepository } from '../repositories/payment-repository'
import { OnWinnerDefinedCreatePayment } from './on-winner-defined-create-payment'

export function registerAuctionSubscribers(
  paymentRepository: PaymentRepository,
): void {
  new OnWinnerDefinedCreatePayment(paymentRepository)
}
