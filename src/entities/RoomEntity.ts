import { OpenUserDataInterface } from "../models/UserSchema"
import { ConnectedUserInterfaceType } from "../controllers/OnlineController"
import { GameClassInterface, PlayerClassType } from "../data/game-classes/GameClass"
import { GameMapInterface, getRandomMap, getRandomRespawn } from "../data/GameMaps"
import { createRandomString } from "../libs/createRandomString"
import { PlayerAnimationType, PlayerComandType, PlayerInterface, PlayerPositionInterface } from "../models/UserModel"
import { createRandomNumber } from "../libs/createRandomNumber"

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

export class RommEntity {
  public hash = null
  public players: GameRoomPlayerInterface[] = []
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
  public roomUID: string = null

  private decrementTimeFunctionHash = null
  private minPlayerCount = 2

  constructor (data: RoomEntityCreateData) {
    this.hash = data.hash
    this.gameMode = data.gameMode
    this.gameMap = getRandomMap({ gameMode: data.gameMode, playersCount: 10 })
    this.gameStatus = 'preparation'
    this.gameSocket = data.gameSocket.to(this.hash)
  }

  decrementTime () {
    this.gameTime = this.gameTime - 1
    this.gameSocket.emit('update', { time: this.gameTime })

    if (this.gameTime < 120 && this.isCanJoin) {
      this.isCanJoin = false
    }

    if (this.gameTime === 0) this.endGame()
  }

  join (player: JoinToRoomUserParamInterface, userSocket: any) {
    if (this.players.length === this.maxPlayersCount) return

    const notification: RommNotificationsInterface = {
      notificationHash: createRandomString(),
      message: `Игрок ${player.user.username} присоединился к игре`,
      time: Date.toString(),
      type: 'normal'
    }

    this.addNotification(notification)

    const playerComand = this.getPlayerComand()
    const gameRoomPlayer: GameRoomPlayerInterface = {
      ...player,
      socket: userSocket,
      command: playerComand,
      kills: 0,
      dies: 0,
      isAlive: false
    }
    this.players.push(gameRoomPlayer)

    gameRoomPlayer.socket.emit('join-to-room', {
      hash: this.hash,
      status: this.gameStatus
    })

    this.choiceCharter(gameRoomPlayer)
    if (this.players.length === this.maxPlayersCount) this.isCanJoin = false
  }

  choiceCharter (player: GameRoomPlayerInterface) {
    this.redirectPlayer(player, 'choice-charter')
  }

  public onPlayerChoiceCharter (playerId: number, gameClass: GameClassInterface) {
    if (!playerId || !gameClass) return

    const playerIndex = this.players.findIndex((el) => el.user.id === playerId)
    const player = this.players[playerIndex]

    if (!this.players[playerIndex] || !this.players[playerIndex].user?.id) return

    this.players[playerIndex].class = gameClass

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

  getPlayerComand (): PlayerComandType {
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

  onPlayerConnectGame (playerId: number) {
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

    this.respawn(player)
  }

  redirectPlayer (player: GameRoomPlayerInterface, gameInterface: ConnectedUserInterfaceType) {
    player.socket.emit('redirect', gameInterface)
  }

  respawn (player: PlayerInterface) {
    const gameRoomPlayerId = this.players.findIndex(el => el.user.id === player.user.id)
    const respanw = getRandomRespawn({ gameMap: this.gameMap, comand: player.command })

    this.players[gameRoomPlayerId].position = respanw
    this.updatePlayersState()
  }

  onRespawn (onPlayerRespawnData: OnPlayerRespawnInterface) {
    const playerIndex = this.players.findIndex((gamePlayer) => gamePlayer.user.id === onPlayerRespawnData.playerId)

    const playerPosition = getRandomRespawn({ gameMap: this.gameMap, comand: this.players[playerIndex].command })

    this.players[playerIndex].position = playerPosition
    this.players[playerIndex].class = onPlayerRespawnData.gameClass
    this.updatePlayersState()
  }

  addNotification (notification: RommNotificationsInterface) {
    this.notifications.push(notification)
  }

  updatePlayersState () {
    this.gameSocket.emit('update-position', this.players)
  }

  onPlayerMoving (data: OnPlayerMovingInterface) {
    const playerIndex = this.players.findIndex((gamePlayer) => gamePlayer.user.id === data.playerId)

    this.players[playerIndex].position = data.position
    this.players[playerIndex].animation = data.animation

    this.updatePlayersState()
  }

  startGame () {
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

  endGame () {
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

  onPlayerTakeDamage (data: OnPlayerTakeDamageInterface) {
    const playerIndex: number = this.players.findIndex((connectPlayer) => connectPlayer.user.id === data.playerId)

    // this.players[playerIndex].
  }
}
