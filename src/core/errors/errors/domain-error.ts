import { UseCasesError } from '@/core/errors/use-cases-error'

export class DomainError extends Error implements UseCasesError {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}
