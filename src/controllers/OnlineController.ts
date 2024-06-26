import { OnPlayerMovingInterface } from './../entities/RoomEntity'
import { checkToken } from '../libs/checkAuth'
import { Service } from 'typedi'
import { getTokenSromSocket } from '../libs/getTokenSromSocket'
import { FriendEntiry } from '../entities/FriendEntiry'
import { UserEntity } from '../entities/UserEntity'
import { OpenUserDataInterface } from '../models/UserSchema'
import {
  GameModeInterface,
  JoinToRoomUserParamInterface,
  RommEntity,
} from '../entities/RoomEntity'
import { createRandomString } from '../libs/createRandomString'
import {
  SocketController,
  OnMessage,
  ConnectedSocket,
  MessageBody,
  OnConnect,
  OnDisconnect,
  SocketIO,
} from 'socket-controllers'
import {
  //GameClasses,
  PlayerClassType,
  getClassForName,
} from '../data/game-classes/GameClass'

export type ConnectedUserInterfaceType =
  | 'menu'
  | 'game'
  | 'shop'
  | 'inventory'
  | 'choice-charter'
  | 'waiting-for-the-start'

export interface ConnectedUser {
  user: OpenUserDataInterface
  socket: any
  lastActionTime: string
  interface: ConnectedUserInterfaceType
  id: number
}

export interface CreateRoomparamInterface {
  gameMode: GameModeInterface
}

interface SearchRoomParamInterface {
  mode: GameModeInterface
}

interface PlayerChoiceCharacterParamInterface {
  roomHash: string
  gameClass: PlayerClassType
}

@SocketController()
@Service()
export class OnlineController {
  public connectedUsers: ConnectedUser[] = []
  public activeGameRooms: RommEntity[] = []
  public isOnlineControllerOn = false

  activateOnlineController() {
    this.isOnlineControllerOn = true

    setInterval(() => {
      this.activeGameRooms = this.activeGameRooms.filter(
        (room) => !room.isGameEnd
      )
    }, 1000 * 10)
  }

  @OnConnect()
  async connect(@ConnectedSocket() socket: any) {
    try {
      if (!this.isOnlineControllerOn) this.activateOnlineController()

      const userToken = getTokenSromSocket(socket)
      if (!userToken) return

      const { user, ok } = await checkToken(userToken)

      if (!ok) {
        socket.emit('game-error', JSON.stringify({
          status: 401,
          message: 'Unauthorized'
        }))
        return
      }

      socket.handshake.user = user
      socket.handshake.user.isAuth = true

      this.connectedUsers = [...this.connectedUsers, {
        user,
        lastActionTime: Date.toString(),
        interface: 'menu',
        socket,
        id: user.id,
      }]

      socket.join('main-menu')
      socket.handshake.roomHash = 'main-menu'

      socket.emit('auntificated', JSON.stringify({
        username: user.username,
        money: user.money,
        userHash: 'asdawdasdawd',
      }))

      socket.emit('redirect', JSON.stringify({
        location: 'main-menu',
        isAuth: true,
        token: userToken,
      }))
    } catch (e) {}
  }

  @OnDisconnect()
  async disconnect(@ConnectedSocket() socket) {
    const user = socket.handshake.user
    const roomhash = socket.handshake.roomHash

    if (roomhash) {
      const room = this.activeGameRooms.find(el => el.hash == roomhash)

      if (!room) return

      room.disconnect(user.id)
    }

    const userEntity = new UserEntity({ id: user.id, details: user })
    await userEntity.disconnect()
    this.connectedUsers = this.connectedUsers.filter((el) => el.id === user.id)
  }

  @OnMessage('send-message')
  // @EmitOnSuccess('new-message')
  async save(@ConnectedSocket() socket: any, @MessageBody() message: any) {
    if (!socket.handshake.user?.isAuth) {
      socket.emit('game-error', JSON.stringify({
        status: 401,
        message: 'Unauthorized'
      }))
      return
    }

    socket.broadcast.emit('new-message', JSON.stringify({
      message,
    }))
  }

  @OnMessage('choice-character')
  playerChoiceCharacter(
    @ConnectedSocket() socket: any,
    @MessageBody() stringMessage: any
  ) {
    const message: PlayerChoiceCharacterParamInterface =
      JSON.parse(stringMessage)
    const roomHash = socket.handshake.roomHash

    if (!message.gameClass || !roomHash) return

    const playerRoom = this.activeGameRooms.find(
      (room) => room.hash === roomHash
    )

    if (!playerRoom) return

    const playerClass = getClassForName(message.gameClass)

    playerRoom.onPlayerChoiceCharter(socket.handshake.user.id, playerClass)
  }

  @OnMessage('take-damage')
  takeDamage (@ConnectedSocket() socket: any, @MessageBody() stringMessage: any) {
    const message = JSON.parse(stringMessage)
    const roomHash = socket.handshake.roomHash
    const user = socket.handshake.user

    if (!message?.damage) return

    const playerRoom = this.activeGameRooms.find(
      (room) => room.hash === roomHash
    )

    playerRoom.onPlayerTakeDamage({ damage: message.damage, damagerId: message.damagerId, playerId: user.id })
  }

  @OnMessage('take-heal')
  takeHeal (
    @ConnectedSocket() socket: any,
    @MessageBody() stringMessage: any
  ) {
    const message = JSON.parse(stringMessage)
    const roomHash = socket.handshake.roomHash
    const user = socket.handshake.user

    if (!message.heal) return

    const playerRoom = this.activeGameRooms.find(
      (room) => room.hash === roomHash
    )

    playerRoom.onPlayerTakeHeal({ power: message.power, playerId: user.id })
  }

  @OnMessage('respawn')
  respawn (@ConnectedSocket() socket: any) {
    const roomHash = socket.handshake.roomHash
    const user = socket.handshake.user

    const playerRoom = this.activeGameRooms.find(
      (room) => room.hash === roomHash
    )

    playerRoom.onRespawn(user.id)
  }

  @OnMessage('move')
  playerMove (@ConnectedSocket() socket: any, @MessageBody() stringMessage: any) {
    const message: OnPlayerMovingInterface = JSON.parse(stringMessage)
    const roomHash = socket.handshake.roomHash
    const user = socket.handshake.user

    if (!message.animation || !message.position) return

    const playerRoom = this.activeGameRooms.find(
      (room) => room.hash === roomHash
    )

    if (!playerRoom) return

    playerRoom.onPlayerMoving({
      position: message.position,
      playerId: user.id,
      animation: message.animation,
    })
  }

  @OnMessage('add-to-friends')
  async addToFriends(
    @ConnectedSocket() socket: any,
    @MessageBody() stringMessage: any
  ) {
    const user = socket.handshake.user

    const message = JSON.parse(stringMessage)
    const friendUsername = message.friendName

    const friend = new FriendEntiry({ user, friendUsername })
    const response = await friend.add()

    if (response.body?.friends?.length) {
      socket.handshake.user.friends = response.body.friends
    }
    socket.emit('friends-list-update', response)
  }

  @OnMessage('search-game')
  async searchRoom(
    @ConnectedSocket() socket: any,
    @MessageBody() stringMessage: any,
    @SocketIO() io: any
  ) {
    const message: SearchRoomParamInterface = JSON.parse(stringMessage)

    if (socket.handshake.roomHash !== 'main-menu') {
      socket.emit(
        'game-error',
        JSON.stringify({
          message: 'Для поиска игры вы должны находиться в главном меню. Если вы видите это сообщение, находясь в нём, пожалуйста, перезагрузите игру',
        })
      )
      return
    }

    const user: JoinToRoomUserParamInterface = {
      user: socket.handshake.user,
    }

    const suitableRooms = message.mode
      ? this.activeGameRooms.filter((room) => room.isCanJoin && room.gameMode === message.mode)
      : this.activeGameRooms.filter(room => room.isCanJoin)

    if (!suitableRooms.length) {
      const room = await this.createRoom(io, { gameMode: message.mode || 'deathmatch' })

      socket.join(room.hash)
      socket.handshake.roomHash = room.hash
      room.join(user, socket)

      return
    }

    const sortedSuitableRooms = suitableRooms.sort((a, b) => {
      if (a.players.length > b.players.length) return 1
      if (a.players.length < b.players.length) return -1
      return 0
    })

    const playerRoom = sortedSuitableRooms[0]

    setTimeout(() => {
      socket.join(playerRoom.hash)
      socket.handshake.roomHash = playerRoom.hash
      playerRoom.join(user, socket)
    }, 0)
  }

  @OnMessage('leave-room')
  async leaveRoom (@ConnectedSocket() socket: any) {
    const roomHash = socket.handshake.roomHash
    const user = socket.handshake.user

    const playerRoom = this.activeGameRooms.find(
      (room) => room.hash === roomHash
    )

    if (!playerRoom) return

    playerRoom.disconnect(user)
  }

  async createRoom(io: any, roomData: CreateRoomparamInterface) {
    const createRoomHash = async () => {
      const hash = await createRandomString()

      const isRoomHashExists = this.activeGameRooms.find(
        (room) => room.hash === hash
      )

      if (isRoomHashExists) return createRoomHash()
      else return hash
    }

    const roomHash = await createRoomHash()

    const room = new RommEntity({
      hash: roomHash,
      gameMode: roomData.gameMode,
      gameTime: 240,
      gameSocket: io,
      roomCreatedTime: Date().toString(),
    })

    room.emitter.on('end-game', () => {
      this.activeGameRooms = this.activeGameRooms.filter((el => el.hash === room.hash))
    })

    this.activeGameRooms.push(room)

    return room
  }
}
