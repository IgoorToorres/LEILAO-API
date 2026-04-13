import { faker } from '@faker-js/faker'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Email } from '@/domain/auction/enterprise/entities/value-objects/user/email'
import { BirthDate } from '@/domain/auction/enterprise/entities/value-objects/user/birth-date'
import {
  UserStatus,
  VerificationStatus,
} from '@/domain/auction/enterprise/entities/value-objects/user/user-status'
import { User } from '@/domain/auction/enterprise/entities/user'

type MakeUserOverrides = Partial<{
  name: string
  email: Email
  birthDate: BirthDate
  status: UserStatus
  verificationStatus: VerificationStatus
  createdAt: Date
  updatedAt: Date
}>

export function makeUser(
  overrides: MakeUserOverrides = {},
  id?: UniqueEntityId,
) {
  const now = new Date()

  const user = User.create(
    {
      name: faker.person.fullName(),
      email: Email.create(faker.internet.email()),
      birthDate: BirthDate.createFromDate(
        faker.date.birthdate({ min: 18, max: 60, mode: 'age' }),
      ),
      status: UserStatus.active(),
      verificationStatus: VerificationStatus.approved(),
      createdAt: now,
      updatedAt: now,
      // Sobrescreve qualquer campo enviado pelo teste
      ...overrides,
    },
    id,
  )

  return user
}
