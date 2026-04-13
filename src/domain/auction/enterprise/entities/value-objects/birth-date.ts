// Exemplo de uso:
// const birthDate = BirthDate.createFromDate(new Date("2000-05-10"));
// console.log(birthDate.value);

export class BirthDate {
  // Valor de data de nascimento (fonte de verdade)
  public value: Date

  // Regra de negócio: idade mínima permitida
  private static readonly MIN_AGE = 18

  // Construtor privado para forçar criação via factory
  private constructor(value: Date) {
    this.value = value
  }

  // Factory que valida a data e aplica regras de negócio
  static createFromDate(date: Date): BirthDate {
    // Garante que é um Date válido
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new Error('Invalid birth date')
    }

    const now = new Date()

    // Não permite datas no futuro
    if (date > now) {
      throw new Error('Birth date cannot be in the future')
    }

    // Calcula idade com base na data de hoje
    const age = BirthDate.calculateAge(date, now)

    // Valida idade mínima
    if (age < BirthDate.MIN_AGE) {
      throw new Error(`User must be at least ${BirthDate.MIN_AGE} years old`)
    }

    // Retorna o VO válido
    return new BirthDate(date)
  }

  // Calcula idade levando em conta mês e dia
  private static calculateAge(birthDate: Date, today: Date): number {
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()

    // Se ainda não fez aniversário no ano corrente, reduz 1
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }
}
