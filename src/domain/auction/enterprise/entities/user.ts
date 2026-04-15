import { Entity } from '@/core/entities/entity'
import { BirthDate } from './value-objects/user/birth-date'
import { Email } from './value-objects/user/email'
import {
  UserStatus,
  VerificationStatus,
} from './value-objects/user/user-status'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

interface UserProps {
  name: string
  email: Email
  birthDate: BirthDate
  status: UserStatus
  verificationStatus: VerificationStatus
  createdAt: Date
  updatedAt: Date
}

export class User extends Entity<UserProps> {
  static create(
    props: Omit<
      UserProps,
      'status' | 'verificationStatus' | 'createdAt' | 'updatedAt'
    > &
      Partial<
        Pick<
          UserProps,
          'status' | 'verificationStatus' | 'createdAt' | 'updatedAt'
        >
      >,
    id?: UniqueEntityId,
  ) {
    const now = new Date()

    const user = new User(
      {
        ...props,
        status: props.status ?? UserStatus.active(),
        verificationStatus:
          props.verificationStatus ?? VerificationStatus.pending(),
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    )

    if (user.props.updatedAt < user.props.createdAt) {
      throw new Error('updatedAt cannot be earlier than createdAt')
    }

    return user
  }

  get status() {
    return this.props.status.value
  }

  get verificationStatus() {
    return this.props.verificationStatus.value
  }
}
