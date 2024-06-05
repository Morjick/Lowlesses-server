import { GameClassModel } from '../../models/GameClassModel'
import { GameRoomPlayerInterface } from '../../entities/RoomEntity'
import { ArcherClass } from './ArcherClass'
import { KnightClass } from './KnightClass'
import { OpenUserDataInterface } from '../../models/UserSchema'
import { GameSkillModel } from '../../models/GameSkillModel'

export type PlayerClassType =
  | 'KNIGHT'
  | 'PRIEST'
  | 'ARCHER'
  | 'PALADIN'
  | 'ROGUE'
  | 'BARBARIAN'
  | 'MAGE'
  | 'WARLOCK'
  | 'DRUID'
  | 'SHAMAN'
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
  range?: number
  skillPrice: number
  locked?: boolean
}

export interface GameClassInterface {
  name: PlayerClassType
  hp: number
  speed: number
  attackPower: number
  skills: GameClassSkillInterface[]
  classPrice: number
  locked?: boolean
}

export const GameClasses: GameClassInterface[] = []
export const GameDefaultClass: GameClassInterface[] = [ArcherClass, KnightClass]

export const getClassForName = (className: string): GameClassInterface => {
  return GameClasses.find((gameClass) => {
    return gameClass.name.toLowerCase() === className.toLowerCase()
  })
}

export const getGameClassesFromDB = async () => {
  const gameClassesModels = await GameClassModel.findAll({
    include: {
      all: true,
      nested: true,
    },
  })

  gameClassesModels.forEach((gameClassModel) => {
    const gameClass = gameClassModel.dataValues
    const skills = gameClass.skills.map((skill) => skill.dataValues)

    GameClasses.push({
      ...gameClass,
      skills,
    })
  })

  console.warn(`Все классы были получены`)
}

export const getGamseClassesFromUser = (user: OpenUserDataInterface) => {
  return GameClasses.map((gameClass) => {
    const isGameClassExist = user.userLockedData.classes.find(
      (writedClass) => writedClass.name === gameClass.name
    )

    if (isGameClassExist) {
      if (isGameClassExist.locked === undefined) {
        return {
          ...isGameClassExist,
          skills: isGameClassExist.skills.map((skill) => {
            return { ...skill, locked: true }
          }),
        }
      }

      return isGameClassExist
    }

    return {
      ...gameClass,
      locked: true,
      skills: gameClass.skills.map((skill) => {
        return {
          ...skill,
          locked: true,
        }
      }),
    }
  })
}
