import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Payment } from '../../enterprise/entities/payment'

export interface PaymentRepository {
  create(payment: Payment): Promise<void>
  findPendingByAuctionId(auctionId: UniqueEntityId): Promise<Payment | null>
  findAllPendingByAuctionId(auctionId: UniqueEntityId): Promise<Payment[]>
  findByAuctionId(auctionId: UniqueEntityId): Promise<Payment | null>
  update(payment: Payment): Promise<void>
}
