// Exemplo de uso:
// const price = Money.create(15000); // R$ 150,00
// const fee = Money.create(2500);    // R$ 25,00
// const total = price.add(fee);
// console.log(total.value);    // 17500
// console.log(total.currency); // BRL

export class Money {
  // Valor em centavos (evita problemas de ponto flutuante)
  public readonly value: number
  // Moeda no padrão ISO (ex: BRL, USD)
  public readonly currency: string

  // Construtor privado para forçar criação via factory
  private constructor(value: number, currency: string) {
    this.value = value
    this.currency = currency
  }

  // Factory com validações básicas
  static create(valueInCents: number, currency = 'BRL'): Money {
    // Só aceita inteiro (centavos)
    if (!Number.isInteger(valueInCents)) {
      throw new Error('Money value must be an integer (cents)')
    }

    // Não permite valor negativo
    if (valueInCents < 0) {
      throw new Error('Money value cannot be negative')
    }

    // Valida formato da moeda
    if (!currency || currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code')
    }

    return new Money(valueInCents, currency.toUpperCase())
  }

  // Soma dois valores (mesma moeda)
  add(other: Money): Money {
    this.assertSameCurrency(other)
    return new Money(this.value + other.value, this.currency)
  }

  // Subtrai dois valores (mesma moeda)
  subtract(other: Money): Money {
    this.assertSameCurrency(other)

    // Não permite ficar negativo
    if (other.value > this.value) {
      throw new Error('Insufficient amount')
    }

    return new Money(this.value - other.value, this.currency)
  }

  // Compara igualdade de valor e moeda
  equals(other: Money): boolean {
    return this.value === other.value && this.currency === other.currency
  }

  // Garante que operações só aconteçam com mesma moeda
  private assertSameCurrency(other: Money) {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch')
    }
  }
}
