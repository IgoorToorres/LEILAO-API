import { UseCasesError } from '@/core/errors/use-cases-error'

export class NotAllowedError extends Error implements UseCasesError {
  constructor() {
    super('Not allowed.')
  }
}
