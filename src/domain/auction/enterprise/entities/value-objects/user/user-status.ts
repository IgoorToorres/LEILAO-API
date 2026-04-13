export type UserStatusValue = 'active' | 'blocked'
export type VerificationStatusValue = 'pending' | 'approved' | 'rejected'

export class UserStatus {
  public value: UserStatusValue

  private constructor(value: UserStatusValue) {
    this.value = value
  }

  static active() {
    return new UserStatus('active')
  }

  static blocked() {
    return new UserStatus('blocked')
  }
}

export class VerificationStatus {
  public value: VerificationStatusValue

  private constructor(value: VerificationStatusValue) {
    this.value = value
  }

  static pending() {
    return new VerificationStatus('pending')
  }

  static approved() {
    return new VerificationStatus('approved')
  }

  static rejected() {
    return new VerificationStatus('rejected')
  }
}
