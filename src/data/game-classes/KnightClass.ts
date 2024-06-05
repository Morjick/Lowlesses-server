import {
  GameClassInterface,
  GameClassSkillInterface,
  GameSkillEffectParamsInterface,
} from './GameClass'

export const KnightClassSkills: GameClassSkillInterface[] = [
  {
    name: 'Lunge',
    damage: 120,
    cooldown: 15,
    isMassive: false,
    skillLevel: 0,
    isHaveEffect: true,
    effect: (gameData: GameSkillEffectParamsInterface) => {},
    skillPrice: 500,
  },
  {
    name: 'A whirlwind of blades',
    damage: 150,
    cooldown: 30,
    isMassive: true,
    skillLevel: 0,
    isHaveEffect: false,
    effect: (gameData: GameSkillEffectParamsInterface) => {},
    skillPrice: 1000,
  },
]

export const KnightClass: GameClassInterface = {
  name: 'KNIGHT',
  hp: 2000,
  speed: 4,
  attackPower: 40,
  skills: KnightClassSkills,
  classPrice: 800,
}
