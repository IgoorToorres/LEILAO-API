export type PaymentStatusValue = 'pending' | 'confirmed' | 'failed' | 'refunded'

export class PaymentStatus {
  public value: PaymentStatusValue

  private constructor(value: PaymentStatusValue) {
    this.value = value
  }

  get pending() {
    return new PaymentStatus('pending')
  }

  get confirmed() {
    return new PaymentStatus('confirmed')
  }

  get failed() {
    return new PaymentStatus('failed')
  }

  get refunded() {
    return new PaymentStatus('refunded')
  }
}
