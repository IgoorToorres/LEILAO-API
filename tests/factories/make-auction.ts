import { Auction } from '@/domain/auction/enterprise/entities/auction'
import { AuctionStatus } from '@/domain/auction/enterprise/entities/value-objects/auction/auction-status'
import { Lot } from '@/domain/auction/enterprise/entities/lot'
import { Money } from '@/domain/auction/enterprise/entities/value-objects/money'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Bid } from '@/domain/auction/enterprise/entities/bid'

type MakeAuctionOverrides = Partial<{
  title: string
  description: string
  status: AuctionStatus
  startAt: Date
  endAt: Date
  lots: Lot[]
  bids: Bid[]
  minBidIncrementPercentage: number
  extensionWindowMinutes: number
  createdAt: Date
  updatedAt: Date
}>

// Carrega o faker de forma dinâmica (compatível com CJS)
async function getFaker() {
  const { faker } = await import('@faker-js/faker')
  return faker
}

// Factory auxiliar para criar um lote válido
async function makeLot(): Promise<Lot> {
  const faker = await getFaker()
  const now = new Date()

  // Gera preço inicial em centavos
  const startingPrice = Money.create(
    faker.number.int({ min: 1000, max: 100000 }),
  )

  return Lot.create({
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    quantity: faker.number.int({ min: 1, max: 10 }),
    startingPrice,
    createdAt: now,
    updatedAt: now,
  })
}

// Factory principal do Auction
export async function makeAuction(
  overrides: MakeAuctionOverrides = {},
  id?: UniqueEntityId,
) {
  const faker = await getFaker()
  const now = new Date()

  // Define período padrão do leilão
  const startAt = new Date(now.getTime() + 60 * 60 * 1000)
  const endAt = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  const auction = Auction.create(
    {
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      status: AuctionStatus.scheduled(),
      startAt,
      endAt,
      lots: [await makeLot()],
      bids: [],
      minBidIncrementPercentage: 5,
      extensionWindowMinutes: 5,
      createdAt: now,
      updatedAt: now,
      // Sobrescreve qualquer campo enviado pelo teste
      ...overrides,
    },
    id,
  )

  return auction
}
