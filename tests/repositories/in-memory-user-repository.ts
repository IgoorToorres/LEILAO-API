import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UserRepository } from '@/domain/auction/application/repositories/user-repository'
import { User } from '@/domain/auction/enterprise/entities/user'

export class InMemoryUserRepository implements UserRepository {
  items: User[] = []

  async create(user: User) {
    this.items.push(user)
  }

  async findById(id: UniqueEntityId): Promise<User | null> {
    const user = this.items.find((item) => item.id.equals(id))

    if (!user) return null

    return user
  }
}
