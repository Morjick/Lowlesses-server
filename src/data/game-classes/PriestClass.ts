import {
  GameClassInterface,
  GameClassSkillInterface,
  GameSkillEffectParamsInterface,
} from './GameClass'

export const PriestSkills: GameClassSkillInterface[] = [
  {
    name: 'Mass healing',
    damage: 60,
    cooldown: 15,
    isMassive: true,
    skillLevel: 0,
    isHaveEffect: true,
    effect: (gameData: GameSkillEffectParamsInterface) => {
      gameData.targets.forEach((el) => {
        el.takeHeal(60)
      })
    },
    skillPrice: 500,
  },
  {
    name: 'Chains of light',
    damage: 0,
    cooldown: 15,
    isMassive: true,
    skillLevel: 0,
    isHaveEffect: true,
    effect: (gameData: GameSkillEffectParamsInterface) => {},
    skillPrice: 1000,
  },
]

export const PriestClass: GameClassInterface = {
  name: 'PRIEST',
  hp: 600,
  speed: 5,
  attackPower: 20,
  skills: PriestSkills,
  classPrice: 1200,
}
