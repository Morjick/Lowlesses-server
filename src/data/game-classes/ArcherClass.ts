import { GameClassInterface, GameClassSkillInterface, GameSkillEffectParamsInterface } from "./GameClass";

export const ArcherClassSkills: GameClassSkillInterface[] = [
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

export const ArcherClass: GameClassInterface = {
  name: 'ARCHER',
  hp: 1000,
  speed: 5,
  attackPower: 40,
  skills: ArcherClassSkills
}
