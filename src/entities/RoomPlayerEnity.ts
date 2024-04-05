import { OpenUserDataInterface } from "../models/UserSchema"
import { PlayerAnimationType, PlayerComandType, PlayerPositionInterface } from "../models/UserModel"
import { GameClassInterface } from "../data/game-classes/GameClass"
import { GameMapInterface, getRandomRespawn } from "../data/GameMaps"

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
  public class: GameClassInterface = null
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

  private readonly respawnForMonyPrice = 10

  constructor (createData: CreateRoomPlayerEntityInterface) {
    this.socket = createData.socket
    this.command = createData.command
    this.kills = 0
    this.dies = 0
    this.user = createData.user
    this.gameMap = createData.gameMap
  }

  changeClass (gameClass: GameClassInterface) {
    const isClassLocked = this.user.userLockedData.classes.find((playerClass) => playerClass.name === gameClass.name)

    if (isClassLocked) {
      this.class = this.user.userLockedData.classes.find((playerClass) => playerClass.locked)
      return
    }

    this.class = gameClass
    this.hp = this.class.hp
    this.speed = this.class.speed
    this.damage = this.class.attackPower

    this.socket.emit('update:change-class', {
      class: this.class,
    })
  }

  die () {
    this.respawnTimeout = 10
    this.dies = this.dies + 1

    this.socket.emit('update:player-die')
    this.socket.emit('redirect', 'choice-charter')

    this.respawnTimeoutFunction = setInterval(() => {
      this.respawnTimeout = this.respawnTimeout - 1

      if (this.respawnTimeout <= 0) clearInterval(this.respawnTimeoutFunction)
    })
  }

  respawn () {
    if (this.respawnTimeout > 0) return

    this.position = getRandomRespawn({ gameMap: this.gameMap, comand: this.command })
    this.socket.emit('redirect', 'game')
  }

  respawnForMoney () {
    if (this.user.money < this.respawnForMonyPrice) return

    this.user.money = this.user.money - this.respawnForMonyPrice
    this.respawnTimeout = 0
    clearInterval(this.respawnTimeoutFunction)
    this.respawn()
  }

  move (data: PlayerMoveParamInterface) {
    this.position = data.position
    this.animation = data.animation

    this.socket('update:approove-action', {
      position: this.position,
      animation: this.animation,
    })
  }

  takeDamage (damage: number) {
    const totalDamage = (damage - (damage * this.armorPersent / 100))
    this.hp = this.hp - totalDamage

    this.socket.emit('update:take-damage', {
      hp: this.hp,
      damage: totalDamage,
    })

    if (this.hp <= 0) this.die()
  }

  incrementKills () {
    this.kills = this.kills + 1
  }
}
