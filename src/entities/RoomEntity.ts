import { OpenUserDataInterface } from '../models/UserSchema'
import { ConnectedUserInterfaceType } from '../controllers/OnlineController'
import { GameClassInterface } from '../data/game-classes/GameClass'
import {
  CoordsInterface,
  GameMapInterface,
  getRandomMap,
} from '../data/GameMaps'
import { createRandomString } from '../libs/createRandomString'
import {
  PlayerAnimationType,
  PlayerComandType,
  PlayerInterface,
  PlayerPositionInterface,
} from '../models/UserModel'
import { RoomPlayerEnity } from './RoomPlayerEnity'
import { isObjectInRadius } from '../libs/game-utils/isInRadius'
import { EventEmitter } from 'events'

export interface RoomEntityCreateData {
  hash: string
  roomCreatedTime: string
  gameTime?: number
  gameMode: GameModeInterface
  gameSocket: any
}

export type GameModeInterface =
  | 'deathmatch'
  | 'team dethmatch'
  | 'crystal capture'
  | 'capture the flag'
export type NotificationTypeType = 'warning' | 'critical' | 'normal'
export type GameRoomStatus = 'preparation' | 'in-progress' | 'end'

export interface RommNotificationsInterface {
  time: string
  message: string
  type: NotificationTypeType
  notificationHash: string
}

export interface GameRoomPlayerInterface extends PlayerInterface {
  socket: any
}

export interface OnPlayerRespawnInterface {
  playerId: number
  gameClass: GameClassInterface
}

export interface OnPlayerMovingInterface {
  playerId: number
  position: PlayerPositionInterface
  animation: PlayerAnimationType
}

export interface OnPlayerTakeDamageInterface {
  playerId: number
  damage: number
  damagerId: number
}

export interface OnPlayerTakeHealInterface {
  power: number
  playerId: number
}

export interface JoinToRoomUserParamInterface {
  user: OpenUserDataInterface
}

export interface PlayerMoveInterface {
  playerId: number
  position: PlayerPositionInterface
}

export interface GetPlayersInRadiusInterface {
  radius: number
  command?: PlayerComandType
  position: CoordsInterface
}

export class RommEntity {
  public hash = null
  public players: RoomPlayerEnity[] = []
  public gameMode: GameModeInterface = null
  public gameStart: string = ''
  public gameTime: number = 250
  public notifications: RommNotificationsInterface[] = []
  public gameMap: GameMapInterface = null
  public isCanJoin: boolean = true
  public blueTeamPoints: number = 0
  public redTeamPoints: number = 0
  public gameStatus: GameRoomStatus = null
  public gameSocket: any = null
  public maxPlayersCount = 10
  public isGameEnd = false

  private decrementTimeFunctionHash = null
  private minPlayerCount = 2
  public emitter = null

  constructor(data: RoomEntityCreateData) {
    this.hash = data.hash
    this.gameMode = data.gameMode
    this.gameMap = getRandomMap({ gameMode: data.gameMode, playersCount: 10 })
    this.gameStatus = 'preparation'
    this.gameSocket = data.gameSocket.to(this.hash)
    this.emitter = new EventEmitter()
  }

  private decrementTime() {
    this.gameTime = this.gameTime - 1
    this.gameSocket.emit('update', { time: this.gameTime })

    if (this.gameTime < 120 && this.isCanJoin) {
      this.isCanJoin = false
      this.updateGameState()
    }

    if (this.gameTime === 0) this.endGame()
  }

  public async join(player: JoinToRoomUserParamInterface, userSocket: any) {
    if (this.players.length === this.maxPlayersCount) return

    const notification: RommNotificationsInterface = {
      notificationHash: await createRandomString(),
      message: `Игрок ${player.user.username} присоединился к игре`,
      time: new Date().toLocaleString('ru'),
      type: 'normal',
    }

    this.addNotification(notification)

    const playerComand = this.getPlayerComand()
    const gameRoomPlayer: RoomPlayerEnity = new RoomPlayerEnity({
      socket: userSocket,
      command: playerComand,
      user: player.user,
      gameMap: this.gameMap,
    })

    gameRoomPlayer.emitter.on('update-player-state', () => this.updateGameState())
    gameRoomPlayer.emitter.on('player-die', (data) => {
      const killer = this.players.find((el) => el.user.id === data.killerId)

      if (!killer) return
      killer.incrementKills()
    })

    const players = this.players.filter(el => el.user.id !== player.user.id)
    this.players = [...players, gameRoomPlayer]

    gameRoomPlayer.socket.emit('join-to-room', JSON.stringify({
      hash: this.hash,
      status: this.gameStatus,
      gameMode: this.gameMode,
      isCanJoin: this.isCanJoin,
      players: this.players.map(el => { return { ...el, socket: null } }),
    }))

    this.updateGameState()
    this.choiceCharter(gameRoomPlayer)
    if (this.players.length === this.maxPlayersCount) this.isCanJoin = false
  }

  public disconnect(playerId: number) {
    const player = this.players.find(((element) => element.user.id !== playerId))
    this.players = this.players.filter((element) => element.user.id !== playerId)

    player.socket.emit('redirect', 'main-menu')

    this.addNotification({
      message: `Игрок ${player.user.username} покинул игру`,
      time: Date.toString(),
      type: 'normal',
      notificationHash: createRandomString(),
    })

    this.updateGameState()
  }

  public choiceCharter(player: GameRoomPlayerInterface) {
    this.redirectPlayer(player, 'choice-charter')
  }

  public onPlayerChoiceCharter(
    playerId: number,
    gameClass: GameClassInterface
  ) {
    if (!playerId || !gameClass) return

    const playerIndex = this.players.findIndex((el) => el.user.id === playerId)
    const player = this.players[playerIndex]

    if (!this.players[playerIndex] || !this.players[playerIndex].user?.id)
      return

    this.players[playerIndex].changeClass(gameClass)
    
    this.updateGameState()
    if (this.gameStatus === 'preparation') {
      this.gameSocket.emit('update-players-class', JSON.stringify({
        players: this.players.map((player) => {
          return { ...player, socket: null }
        }),
      }))

      this.redirectPlayer(player, 'waiting-for-the-start')
      this.startGame()
    }

    if (this.gameStatus === 'in-progress') {
      this.onPlayerConnectGame(player.user.id)
      this.redirectPlayer(player, 'game')
    }
  }

  public getPlayerComand(): PlayerComandType {
    if (this.gameMode === 'deathmatch') return 'any'

    let blueTeamCount = 0
    let redTeamCount = 0

    this.players.forEach((player) => {
      const playerTeam = player.command

      if (playerTeam === 'red') redTeamCount++
      if (playerTeam === 'blue') blueTeamCount++
    })

    if (blueTeamCount > redTeamCount) return 'red'
    else return 'blue'
  }

  public onPlayerConnectGame(playerId: number) {
    const player = this.players.find(
      (connectedPlayer) => connectedPlayer.user.id === playerId
    )

    if (!player || !player.user.id) return

    this.updateGameState()
    this.onRespawn(playerId)
  }

  public redirectPlayer(
    player: GameRoomPlayerInterface,
    gameInterface: ConnectedUserInterfaceType
  ) {
    player.socket.emit('redirect', JSON.stringify({
      location: gameInterface,
      isAuth: true,
      token: 'lajwdkhjagshkdbawkhydgasid',
    }))
  }

  public onRespawn(playerId: number) {
    this.players
      .find((connectedPlayer) => connectedPlayer.user.id === playerId)
      .respawn()

    this.updateGameState()
  }

  public addNotification(notification: RommNotificationsInterface) {
    this.notifications.push(notification)
    this.gameSocket.emit('notification', JSON.stringify({
      message: notification.message,
      hash: notification.notificationHash,
      time: new Date().toLocaleString('ru'),
      type: notification.type,
    }))
  }

  public onPlayerMoving(data: OnPlayerMovingInterface) {
    if (this.gameStatus !== 'in-progress') return

    this.players
      .find((gamePlayer) => gamePlayer.user.id === data.playerId)
      .move({ position: data.position, animation: data.animation })

      // this.updateGameState()
  }

  public onPlayerTakeDamage(data: OnPlayerTakeDamageInterface) {
    const playerIndex: number = this.players.findIndex(
      (connectPlayer) => connectPlayer.user.id === data.playerId
    )

    this.players[playerIndex].takeDamage(data.damage, data.damagerId)
  }

  public onPlayerTakeHeal (data: OnPlayerTakeHealInterface) {
    const playerIndex: number = this.players.findIndex(
      (connectPlayer) => connectPlayer.user.id === data.playerId
    )

    this.players[playerIndex].takeHeal(data.power)
  }

  public startGame() {
    try {
      if (this.players.length < this.minPlayerCount) {
        this.gameSocket.emit('room-warning',
          JSON.stringify({
            message: `Игра не может начаться, пока в ней не будет минимум ${this.minPlayerCount} игроков`
        }))

        return
      }

      const playerExists = this.players.filter(player => player.className !== null)

      if (playerExists.length < this.minPlayerCount) {
        this.gameSocket.emit('room-warning',
          JSON.stringify({
            message: `Ожидание готовности от игроков`
        }))

        return
      }

      this.players.forEach((player, playerIndex) => {
        const playerPosition: PlayerPositionInterface =
          this.gameMap.comandRespawns[playerIndex]
        this.players[playerIndex].position = playerPosition
      })

      this.gameStart = new Date().toLocaleString('ru')
      this.gameStatus = 'in-progress'

      this.gameSocket.emit('update-game-status', 'game-start')

      setTimeout(() => {
        this.decrementTimeFunctionHash = setInterval(() => {
          this.decrementTime()
        }, 1000)
      }, 5000)
    } catch (e) {
      this.gameSocket.emit('room-warning', `Произошла ошибка`)
    }
  }

  public endGame() {
    if (this.gameMode === 'deathmatch') {
      const playersKillsCount = this.players.reduce((acc, player) => {
        return acc + player.kills
      }, 0)

      let maxPlayerReward = Math.ceil(playersKillsCount / 2)
      const playersReward: number[] = []

      for (let i = 0; i < this.players.length; i++) {
        maxPlayerReward =
          i === 0
            ? maxPlayerReward
            : Math.ceil(maxPlayerReward - (maxPlayerReward * 10) / 100)
        playersReward.push(maxPlayerReward)
      }

      const topPlayersForKills = this.players.sort((a, b) => {
        if (a.kills > b.kills) return 1
        if (a.kills < b.kills) return -1
        return 0
      })

      topPlayersForKills.forEach((player, ind) => {
        player.socket.emit('get-reward', playersReward[ind])
      })
    } else {
      const winersRewards = [50, 100, 120, 150, 200]
      const loosersRewards = [20, 40, 60, 80, 100]

      const winCommand = this.blueTeamPoints > this.redTeamPoints ? 'blue' : 'red'
      const winners = this.players.filter(el => el.command == winCommand)
      const loosers = this.players.filter(el => el.command != winCommand)

      winners.forEach((player, index) => {
        const reward = winersRewards[index]

        player.socket.handshake.user.money = Number(player.socket.handshake.user.money) + reward || reward
        player.socket.emit('get-reward', JSON.stringify({
          money: reward
        }))
      })

      loosers.forEach((player, index) => {
        const reward = loosersRewards[index]

        player.socket.handshake.user.money = Number(player.socket.handshake.user.money) + reward || reward
        player.socket.emit('get-reward', JSON.stringify({
          money: loosersRewards[index]
        }))
      })
    }

    this.isGameEnd = true
    this.gameSocket.emit('update-game-status', 'game-end')
    clearInterval(this.decrementTimeFunctionHash)
    this.updateGameState()

    this.players.forEach((player) => {
      player.socket.emit('redirect', JSON.stringify({
        location: 'main-menu'
      }))
      player.socket.join('main-menu')
      player.socket.handshake.roomHash = 'main-menu'
    })

    setTimeout(() => this.emitter.emit('end-game'), 5000)
  }

  public getPlayersInRadius(data: GetPlayersInRadiusInterface) {
    const playersInRadius = []

    this.players.forEach((player) => {
      const isPlayerInRadius = isObjectInRadius(
        data.position,
        player.position.coords,
        data.radius
      )

      playersInRadius.push(isPlayerInRadius)
    })

    return playersInRadius
  }

  public updateGameState () {
    const players = this.players.map(el => {
      return { ...el, socket: null, username: el.user.username }
    })

    const data = JSON.stringify({
      players,
      status: this.gameStatus,
      isCanJoin: this.isCanJoin,
      blueTeamPoints: this.blueTeamPoints,
      redTeamPoints: this.redTeamPoints,
      gameMode: this.gameMode,
      gameMap: this.gameMap,
      time: this.gameTime,
      gameMapName: this.gameMap.mapName,
    })

    this.players.forEach(player => {
      player.socket.emit('update-game-state', data)
    })
  }
}
