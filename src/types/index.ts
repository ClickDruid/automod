export interface CarStats {
  power: number
  handling: number
  braking: number
  suspension: number
  weight: number
  turbo: number
}

export interface StatModifier {
  power?: number
  handling?: number
  braking?: number
  suspension?: number
  weight?: number
  turbo?: number
}

export interface CarPart {
  id: string
  name: string
  brand: string
  category: PartCategory
  price: number
  currency: string
  compatible: string[]
  stats: StatModifier
  description: string
  image: string
  tags: string[]
}

export type PartCategory =
  | 'engine'
  | 'suspension'
  | 'brakes'
  | 'exhaust'
  | 'aero'
  | 'wheels'
  | 'intake'
  | 'transmission'

export interface CarModel {
  id: string
  name: string
  brand: string
  year: number
  baseStats: CarStats
  modelPath: string
  color: string
  category: 'jdm' | 'euro' | 'muscle' | 'daily'
}
