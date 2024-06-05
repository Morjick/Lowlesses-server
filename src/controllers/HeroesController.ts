import {
  SocketController,
  OnMessage,
  ConnectedSocket,
  MessageBody,
} from 'socket-controllers'
import { Service } from 'typedi'
import { UserModel } from '../models/UserModel' // PlayerInterface
import {
  PlayerClassType,
  getClassForName,
} from '../data/game-classes/GameClass'
import { OpenUserDataInterface } from '../models/UserSchema'

export interface ByHeroParamInterface {
  hero: PlayerClassType
}

export interface BySkillParamInterface {
  hero: PlayerClassType
  skill: string
}

@SocketController()
@Service()
export class HeroesController {
  @OnMessage('by-hero')
  async byHeroe(
    @ConnectedSocket() socket: any,
    @MessageBody() stringMessage: any
  ) {
    const message: ByHeroParamInterface = JSON.parse(stringMessage)

    if (!message.hero) return

    const user: OpenUserDataInterface = socket.handshake.user

    const playerClass = getClassForName(message.hero)
    const userClass = user.userLockedData.classes.find(
      (el) => el.name === playerClass.name
    )

    if (userClass.locked === undefined && userClass.locked === null) {
      return socket.emit(
        'game-error',
        'Ошибка при покупке персонажа: персонаж с таким именем не найден'
      )
    }

    if (!userClass.locked) {
      socket.emit('game-error', 'У вас уже открыт этот персонаж')
      return
    }

    if (user.money < userClass.classPrice) {
      return socket.emit('game-error', 'Недостаточно кристаллов')
    }

    user.money = user.money - userClass.classPrice
    user.userLockedData.classes.find(
      (el) => el.name === playerClass.name
    ).locked = false

    await UserModel.update(
      { userLockedData: JSON.stringify(user.userLockedData) },
      { where: { id: user.id } }
    )

    socket.handshake.user = user
    socket.emit('update', 'Персонаж разблокирован')
  }

  @OnMessage('by-skill')
  async byClassesSkills(
    @ConnectedSocket() socket: any,
    @MessageBody() stringMessage: any
  ) {
    const message: BySkillParamInterface = JSON.parse(stringMessage)
    if (!message.hero || !message.skill) return

    const user: OpenUserDataInterface = socket.handshake.user

    const playerClass = getClassForName(message.hero)
    const userClass = user.userLockedData.classes.find(
      (el) => el.name === playerClass.name
    )

    if (userClass.locked) {
      socket.emit(
        'game-error',
        'Для покупки навыка необходимо сначала открыть персонажа'
      )
      return
    }

    const skill = userClass.skills.find((skill) => skill.name === message.skill)

    if (!skill.locked) {
      socket.emit('game-error', 'У вас уже разблокирован этот навык')
      return
    }

    if (skill.skillPrice > user.money) {
      socket.emit('game-error', 'Недостаточно кристаллов')
      return
    }

    user.userLockedData.classes
      .find((el) => el.name === playerClass.name)
      .skills.find((skill) => skill.name === message.skill).locked = false

    await UserModel.update(
      { userLockedData: JSON.stringify(user.userLockedData) },
      { where: { id: user.id } }
    )

    socket.handshake.user = user
    socket.emit('update', 'Навык разблокирован')
  }
}
