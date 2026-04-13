export class Email {
  public value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string): Email {
    const normalized = value.trim().toLocaleLowerCase()

    if (!Email.isValid(normalized)) {
      throw new Error('Invalid Email')
    }

    return new Email(normalized)
  }

  private static isValid(value: string): boolean {
    // regex simples para validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }
}
