import { GameClassInterface, GameClassSkillInterface, GameSkillEffectParamsInterface } from "./GameClass";

export const KnightClassSkills: GameClassSkillInterface[] = [
  {
    name: 'Hail of arrows',
    damage: 100,
    cooldown: 15,
    isMassive: true,
    skillLevel: 0,
    isHaveEffect: true,
    effect: (gameData: GameSkillEffectParamsInterface) => {
      
    }
  }
]

export const KnightClass: GameClassInterface = {
  name: 'KNIGHT',
  hp: 2000,
  speed: 4,
  attackPower: 40,
  skills: KnightClassSkills
}
