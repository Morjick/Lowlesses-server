import { OpenUserDataInterface } from "../models/UserSchema"
import { ConnectedUserInterfaceType } from "../controllers/OnlineController"
import { GameClassInterface } from "../data/game-classes/GameClass"
import { CoordsInterface, GameMapInterface, getRandomMap } from "../data/GameMaps"
import { createRandomString } from "../libs/createRandomString"
import { PlayerAnimationType, PlayerComandType, PlayerInterface, PlayerPositionInterface } from "../models/UserModel"
import { RoomPlayerEnity } from "./RoomPlayerEnity"
import { isObjectInRadius } from "../libs/game-utils/isInRadius"
import { EventEmitter } from 'events'

export interface RoomEntityCreateData {
  hash: string
  roomCreatedTime: string
  gameTime?: number
  gameMode: GameModeInterface
  gameSocket: any
}

export type GameModeInterface = 'deathmatch' | 'team dethmatch' | 'crystal capture' | 'capture the flag'
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
  public gameTime: number = 5
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

  constructor (data: RoomEntityCreateData) {
    this.hash = data.hash
    this.gameMode = data.gameMode
    this.gameMap = getRandomMap({ gameMode: data.gameMode, playersCount: 10 })
    this.gameStatus = 'preparation'
    this.gameSocket = data.gameSocket.to(this.hash)
    this.emitter = new EventEmitter()

    this.emitter.on('player-die', (data) => {
      const killer = this.players.find((el) => el.user.id === data.killerId)

      killer.incrementKills()
    })
  }

  decrementTime () {
    this.gameTime = this.gameTime - 1
    this.gameSocket.emit('update', { time: this.gameTime })

    if (this.gameTime < 120 && this.isCanJoin) {
      this.isCanJoin = false
    }

    if (this.gameTime === 0) this.endGame()
  }

  public join (player: JoinToRoomUserParamInterface, userSocket: any) {
    if (this.players.length === this.maxPlayersCount) return

    const notification: RommNotificationsInterface = {
      notificationHash: createRandomString(),
      message: `Игрок ${player.user.username} присоединился к игре`,
      time: Date.toString(),
      type: 'normal'
    }

    this.addNotification(notification)

    const playerComand = this.getPlayerComand()
    const gameRoomPlayer: RoomPlayerEnity = new RoomPlayerEnity({
      socket: userSocket,
      command: playerComand,
      user: player.user,
      gameMap: this.gameMap
    })
    this.players.push(gameRoomPlayer)

    gameRoomPlayer.socket.emit('join-to-room', {
      hash: this.hash,
      status: this.gameStatus
    })

    this.choiceCharter(gameRoomPlayer)
    if (this.players.length === this.maxPlayersCount) this.isCanJoin = false
  }

  public disconnect (player: GameRoomPlayerInterface) {
    this.players.filter(element => element.user.id !== player.user.id)

    player.socket.emit('redirect', 'main-menu')

    this.addNotification({
      message: `Игрок ${player.user.username} покинул игру`,
      time: Date.toString(),
      type: 'normal',
      notificationHash: createRandomString()
    })

  }

  public choiceCharter (player: GameRoomPlayerInterface) {
    this.redirectPlayer(player, 'choice-charter')
  }

  public onPlayerChoiceCharter (playerId: number, gameClass: GameClassInterface) {
    if (!playerId || !gameClass) return

    const playerIndex = this.players.findIndex((el) => el.user.id === playerId)
    const player = this.players[playerIndex]

    if (!this.players[playerIndex] || !this.players[playerIndex].user?.id) return

    this.players[playerIndex].changeClass(gameClass)

    if (this.gameStatus === 'preparation') {
      this.gameSocket.emit('update-players-class', { players: this.players.map((player) => {
        return { ...player, socket: null }
      })})

      this.redirectPlayer(player, 'waiting-for-the-start')
      this.startGame()
    }

    if (this.gameStatus === 'in-progress') {
      this.onPlayerConnectGame(player.user.id)
      this.redirectPlayer(player, 'game')
    }
  }

  public getPlayerComand (): PlayerComandType {
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

  public onPlayerConnectGame (playerId: number) {
    const player = this.players.find((connectedPlayer) => connectedPlayer.user.id === playerId)

    if (!player || !player.user.id) return
    player.socket.emit('edit-game-data', {
      gameMap: this.gameMap,
      players: this.players,
      gameStatus: this.gameStatus,
      hash: this.hash,
      gameMode: this.gameMode,
      gameTime: this.gameTime
    })

    this.onRespawn(playerId)
  }

  public redirectPlayer (player: GameRoomPlayerInterface, gameInterface: ConnectedUserInterfaceType) {
    player.socket.emit('redirect', gameInterface)
  }

  onRespawn (playerId: number) {
    this.players
      .find((connectedPlayer) => connectedPlayer.user.id === playerId)
      .respawn()

    this.updatePlayersState()
  }

  public addNotification (notification: RommNotificationsInterface) {
    this.notifications.push(notification)
  }

  public updatePlayersState () {
    this.gameSocket.emit('update-position', {
      players: this.players.map((player) => {  return { ...player, socket: null }}),
      teamsCount: {
        blue: this.blueTeamPoints,
        red: this.blueTeamPoints,
      },
    })
  }

  private onPlayerMoving (data: OnPlayerMovingInterface) {
    if (this.gameStatus !== 'in-progress') return

    this.players
      .find((gamePlayer) => gamePlayer.user.id === data.playerId)
      .move({ position: data.position, animation: data.animation })

    this.updatePlayersState()
  }

  private onPlayerTakeDamage (data: OnPlayerTakeDamageInterface) {
    const playerIndex: number = this.players.findIndex((connectPlayer) => connectPlayer.user.id === data.playerId)

    this.players[playerIndex].class.hp = this.players[playerIndex].class.hp - data.damage
  }

  public startGame () {
    try {
      if (this.players.length < this.minPlayerCount) {
        this.gameSocket.emit('room-warning', `Игра не может начаться, пока в ней не будет минимум ${this.minPlayerCount} игроков`)
        return
      }
  
      this.players.forEach((player, playerIndex) => {
        const playerPosition: PlayerPositionInterface = this.gameMap.comandRespawns[playerIndex]
        this.players[playerIndex].position = playerPosition
      })
  
      this.gameStart = Date.toString()
      this.gameStatus = 'in-progress'
  
      this.gameSocket.emit('update-game-status', 'game-start')
      
      setTimeout(() => {
        this.gameSocket.emit('redirect', 'game')
        
  
        this.decrementTimeFunctionHash = setInterval(() => {
          this.decrementTime()
        }, 1000)
      }, 5000)
    } catch(e) {
      this.gameSocket.emit('room-warning', `Произошла ошибка`)
    }
  }

  public endGame () {
    if (this.gameMode === 'deathmatch') {
      const playersKillsCount = this.players.reduce((acc, player) => {
        return acc + player.kills
      }, 0)

      let maxPlayerReward = Math.ceil(playersKillsCount / 2)
      const playersReward: number[] = []

      for (let i = 0; i < this.players.length; i++) {
        maxPlayerReward = i === 0 ? maxPlayerReward : Math.ceil(maxPlayerReward - (maxPlayerReward * 10 / 100))
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
    }

    this.isGameEnd = true
    this.gameSocket.emit('update-game-status', 'game-end')
    clearInterval(this.decrementTimeFunctionHash)

    this.players.forEach((player) => {
      player.socket.emit('redirect', 'menu')
      player.socket.join('main-menu')
      player.socket.handshake.roomHash = 'main-menu'
    })
  }

  public getPlayersInRadius (data: GetPlayersInRadiusInterface) {
    this.players.forEach((player) => {
      const isPlayerInRadius = isObjectInRadius(data.position, player.position.coords, data.radius)
    })
  }
}
