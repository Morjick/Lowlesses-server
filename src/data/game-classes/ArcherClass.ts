import { GameClassInterface, GameClassSkillInterface, GameSkillEffectParamsInterface } from "./GameClass";

export const ArcherClassSkills: GameClassSkillInterface[] = [
  {
    name: 'Hail of arrows',
    damage: 100,
    cooldown: 15,
    isMassive: true,
    skillLevel: 0,
    isHaveEffect: true,
    effect: (gameData: GameSkillEffectParamsInterface) => {},
    skillPrice: 500
  },
  {
    name: 'Toxic Fog',
    damage: 150,
    cooldown: 30,
    isMassive: true,
    skillLevel: 0,
    isHaveEffect: true,
    effect: (gameData: GameSkillEffectParamsInterface) => {},
    skillPrice: 1000
  }
]

export const ArcherClass: GameClassInterface = {
  name: 'ARCHER',
  hp: 1000,
  speed: 5,
  attackPower: 40,
  skills: ArcherClassSkills,
  classPrice: 800
}
