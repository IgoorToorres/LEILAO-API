import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { User } from '../../enterprise/entities/user'

export interface UserRepository {
  create(user: User): Promise<void>
  findById(id: UniqueEntityId): Promise<User | null>
}
