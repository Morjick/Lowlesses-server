import fs from 'fs'
import { GameClasses, GameDefaultClass } from '../game-classes/GameClass'
import { GameSkillModel } from '../../models/GameSkillModel'
import { GameClassModel } from '../../models/GameClassModel'

export const createGameShop = async () => {
  try {
    const gameClasses = [...GameDefaultClass]

    gameClasses.forEach(async (gameClass) => {
      const GameClass = await GameClassModel.findOne({ where: { name: gameClass.name } })
      if (GameClass?.dataValues) return

      await GameClassModel.create({
        name: gameClass.name,
        hp: gameClass.hp,
        attackPower: gameClass.attackPower,
        speed: gameClass.speed
      })
    })

    gameClasses.forEach((gameClass) => {
      gameClass.skills.forEach(async (gameSkill) => {
        const GameClass = await GameClassModel.findOne({ where: { name: gameClass.name } })
        
        if (!GameClass) return

        const GameSkill = await GameSkillModel.findOne({ where: { name: gameSkill.name } })

        if (GameSkill && GameSkill.dataValues) return

        await GameSkillModel.create({
          name: gameSkill.name,
          damage: gameSkill.damage,
          cooldown: gameSkill.cooldown,
          isHaveEffect: gameSkill.isHaveEffect,
          isMassive: gameSkill.isMassive,
          skillLevel: '0',
          gameClassId: GameClass.dataValues.id
        })
      })
    })

    console.log(`Все игровые классы и навыки созданы`)
  } catch (e) {
    const errorText = `
      <h1>При создании классов на сервере произошла ошибка</h1>
      <div>${e}</div>
    `

    fs.writeFile('../logs/CreateGameClassError.log.txt', errorText, (err) => {
      console.warn(err)
    })
  }
}
