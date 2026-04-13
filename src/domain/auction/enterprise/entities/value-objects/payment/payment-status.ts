export type PaymentStatusValue = 'pending' | 'confirmed' | 'failed' | 'refunded'

export class PaymentStatus {
  public value: PaymentStatusValue

  private constructor(value: PaymentStatusValue) {
    this.value = value
  }

  static pending() {
    return new PaymentStatus('pending')
  }

  static confirmed() {
    return new PaymentStatus('confirmed')
  }

  static failed() {
    return new PaymentStatus('failed')
  }

  static refunded() {
    return new PaymentStatus('refunded')
  }
}
