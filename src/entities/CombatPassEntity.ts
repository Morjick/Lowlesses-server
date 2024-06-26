export interface CombatPassConstructorInterface {
  seasonNumber: number
  maxLevel: number
  quests: ConmbatPassQuestInterface[]
  maxExp: number
  levelExp: number
}

export type ConmbatPassQuestThemeType = 'kills' | 'regim'

export interface ConmbatPassQuestInterface {
  exp: number
  description: string
  type: ConmbatPassQuestThemeType
  target: any
  reward: number
}

export interface CombatPassBindPlayerInterface {
  exp: number
}

export class CombatPassEntity {
  seasonNumber: number = null
  maxLevel: number
  maxExp: number = null
  levelExp: number
  quests = null
  currentExp: number = 0
  currentLevel: number = 0

  constructor (data: CombatPassConstructorInterface) {
    this.seasonNumber = data.seasonNumber
    this.maxLevel = data.maxLevel
    this.quests = data.quests
    this.maxExp = data.maxExp
    this.levelExp = data.levelExp
  }

  getCombatPass () {
    return this
  }

  bindForPlayer (data: CombatPassBindPlayerInterface) {
    this.currentExp = data.exp
    this.currentLevel = this.currentExp / this.levelExp

    return this
  }
}
