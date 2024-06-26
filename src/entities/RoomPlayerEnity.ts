import { OpenUserDataInterface, UserModel } from '../models/UserSchema'
import {
  PlayerAnimationType,
  PlayerComandType,
  PlayerPositionInterface,
} from '../models/UserModel'
import { GameClassInterface } from '../data/game-classes/GameClass'
import { GameMapInterface, getRandomRespawn } from '../data/GameMaps'
import { EventEmitter } from 'events'

export interface CreateRoomPlayerEntityInterface {
  socket: any
  command: PlayerComandType
  user: OpenUserDataInterface
  gameMap: GameMapInterface
}

export interface PlayerMoveParamInterface {
  position: PlayerPositionInterface
  animation: PlayerAnimationType
}

export class RoomPlayerEnity {
  public socket: any = null
  public command: PlayerComandType = null
  public isAlive: boolean = true
  public user: OpenUserDataInterface = null
  public className: GameClassInterface = null
  public animation: PlayerAnimationType = 'idle'
  public position: PlayerPositionInterface = null
  public gameMap: GameMapInterface = null
  public kills: number = 0
  public dies: number = 0
  public speed: number = null
  public hp: number = null
  public damage: number = null
  public armorPersent: number = 20

  private respawnTimeout = 0
  private respawnTimeoutFunction = null

  private animationTimeout = null

  private readonly respawnForMonyPrice = 10
  public emitter = null

  constructor(createData: CreateRoomPlayerEntityInterface) {
    this.socket = createData.socket
    this.command = createData.command
    this.kills = 0
    this.dies = 0
    this.user = createData.user
    this.gameMap = createData.gameMap
    this.emitter = new EventEmitter()
  }

  public changeClass(gameClass: GameClassInterface) {
    const isClassLocked = this.user.userLockedData.classes.find(
      (playerClass) => playerClass.name === gameClass.name
    )

    if (!isClassLocked) {
      this.className = this.user.userLockedData.classes.find(
        (playerClass) => playerClass.locked
      )
      return
    }

    this.className = gameClass
    this.hp = Math.ceil(this.className.hp)
    this.speed = this.className.speed
    this.damage = this.className.attackPower

    this.updatePlayerState()
  }

  private die(damagerId: number) {
    try {
      this.respawnTimeout = 10
      this.dies = this.dies + 1
      this.isAlive = false

      this.socket.emit('player-die')

      this.emitter.emit('player-die', {
        playerId: this.user.id,
        killerId: damagerId,
      })

      this.respawnTimeoutFunction = setInterval(() => {
        this.respawnTimeout = this.respawnTimeout - 1
        this.socket.emit('respawn-timeout-update', JSON.stringify({
          time: this.respawnTimeout,
        }))
        this.updatePlayerState()

        if (this.respawnTimeout <= 0) clearInterval(this.respawnTimeoutFunction)
      }, 1000)
    } catch (e) {
      console.log('error:', e)
    }
  }

  public respawn() {
    if (this.respawnTimeout > 0) return

    this.position = getRandomRespawn({
      gameMap: this.gameMap,
      comand: this.command,
    })
    this.hp = this.className.hp    
    this.isAlive = true

    this.socket.emit('player-respawn')
    this.updatePlayerState()
  }

  private respawnForMoney() {
    if (this.user.money < this.respawnForMonyPrice) return

    this.user.money = this.user.money - this.respawnForMonyPrice
    this.respawnTimeout = 0
    clearInterval(this.respawnTimeoutFunction)
    this.respawn()
  }

  public move(data: PlayerMoveParamInterface) {
    this.position = data.position
    this.animation = data.animation

    this.updatePlayerState()
    this.animationTimeout = setTimeout(() => {
      this.animation = 'idle'
      this.updatePlayerState()

      clearTimeout(this.animationTimeout)
    }, 500)
  }

  public takeDamage(damage: number, damagerId: number) {
    const totalDamage = damage - (damage * this.armorPersent / 100)
    this.hp = Math.ceil(this.hp - totalDamage)

    this.socket.emit('take-damage', JSON.stringify({
      hp: this.hp,
      damage: totalDamage,
    }))

    if (this.hp <= 0) {
      this.die(damagerId)
    }

    this.updatePlayerState()
  }

  public takeHeal (power: number) {
    const healingHp = this.hp + power > this.className.hp ? this.className.hp : this.hp + power
    this.hp = healingHp

    this.updatePlayerState()
  }

  public incrementKills () {
    this.kills = this.kills + 1
    this.updatePlayerState()
  }

  public updatePlayerState () {
    this.emitter.emit('update-player-state', {
      kills: this.kills,
      dies: this.dies,
      animation: this.animation,
      command: this.command,
      isAlive: this.isAlive,
      position: this.position,
      respawnTimeout: this.respawnTimeout,
    })
  }

  public async getReward (reward: number) {
    const data = await UserModel.findOne({ where: { id: this.user.id } })
    const user = data.dataValues
    
    await UserModel.update({ money: user.money + reward }, { where: { id: this.user.id } })
  }
}
