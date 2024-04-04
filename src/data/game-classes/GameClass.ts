import { GameRoomPlayerInterface } from "../../entities/RoomEntity"
import { ArcherClass } from "./ArcherClass"
import { KnightClass } from "./KnightClass"

export type PlayerClassType = 'KNIGHT' | 'PRIEST' | 'ARCHER' | 'PALADIN' | 'ROGUE' | 'BARBARIAN' | 'MAGE' | 'WARLOCK' | 'DRUID' | 'SHAMAN'
export type SkillLevelType = 0 | 1 | 2 | 3

export interface GameSkillEffectParamsInterface {
  targets: GameRoomPlayerInterface[]
}

export interface GameClassSkillInterface {
  name: string
  damage: number
  cooldown: number
  isMassive: boolean
  skillLevel: SkillLevelType
  isHaveEffect: boolean
  effect: Function
}

export interface GameClassInterface {
  name: PlayerClassType
  hp: number
  speed: number
  attackPower: number
  skills: GameClassSkillInterface[]
}

export const GameClasses: GameClassInterface[] = [ArcherClass, KnightClass]

export const getClassForName = (className: string): GameClassInterface => {
  return GameClasses.find((gameClass) => {
    return gameClass.name.toLowerCase() === className.toLowerCase()
  })
}
