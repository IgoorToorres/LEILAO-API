import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { PaymentRepository } from '@/domain/auction/application/repositories/payment-repository'
import { Payment } from '@/domain/auction/enterprise/entities/payment'

export class InMemoryPaymentRepository implements PaymentRepository {
  public items: Payment[] = []

  async create(payment: Payment): Promise<void> {
    this.items.push(payment)
  }

  async findPendingByAuctionId(
    auctionId: UniqueEntityId,
  ): Promise<Payment | null> {
    const payment = this.items.find(
      (item) =>
        item.auctionId.equals(auctionId) && item.status.value === 'pending',
    )

    if (!payment) return null
    return payment
  }

  async update(payment: Payment): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id.equals(payment.id))

    if (itemIndex < 0) {
      throw new Error('Payment not found')
    }

    this.items[itemIndex] = payment
  }
}
