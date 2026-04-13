import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { User } from '../../enterprise/entities/user'

export interface UserRepository {
  create(user: User): Promise<User>
  findById(id: UniqueEntityId): Promise<User | null>
}
