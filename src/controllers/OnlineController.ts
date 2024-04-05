import { checkToken } from '../libs/checkAuth';
import { Service } from 'typedi';
import { getTokenSromSocket } from '../libs/getTokenSromSocket';
import { FriendEntiry } from '../entities/FriendEntiry';
import { UserEntity } from '../entities/UserEntity';
import { OpenUserDataInterface } from '../models/UserSchema';
import { GameModeInterface, JoinToRoomUserParamInterface, RommEntity } from '../entities/RoomEntity';
import { createRandomString } from '../libs/createRandomString';
import {
  SocketController,
  OnMessage,
  ConnectedSocket,
  MessageBody,
  EmitOnSuccess,
  OnConnect,
  OnDisconnect,
  SocketIO,
} from 'socket-controllers';
import { GameClasses, PlayerClassType, getClassForName } from '../data/game-classes/GameClass';

export type ConnectedUserInterfaceType = 'menu' | 'game' | 'shop' | 'inventory' | 'choice-charter' | 'waiting-for-the-start'

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

  activateOnlineController () {
    this.isOnlineControllerOn = true

    setInterval(() => {
      this.activeGameRooms = this.activeGameRooms.filter(room => !room.isGameEnd)
    }, 1000 * 10)
  }


  @OnConnect()
  async connect(@ConnectedSocket() socket: any, @MessageBody() message: any) {
    try {
      if (!this.isOnlineControllerOn) this.activateOnlineController()

      const userToken = getTokenSromSocket(socket)
      if (!userToken) return

      const { user } = await checkToken(userToken)

      socket.handshake.user = user
      socket.handshake.user.isAuth = true

      this.connectedUsers.push({
        user,
        lastActionTime: Date.toString(),
        interface: 'menu',
        socket,
        id: user.id
      })
      
      socket.join('main-menu')
      socket.handshake.roomHash = 'main-menu'
    } catch(e) {}
  }

  @OnDisconnect()
  async disconnect(@ConnectedSocket() socket) {
    const user = socket.handshake.user

    const userEntity = new UserEntity({ id: user.id, details: user })
    await userEntity.disconnect()
    this.connectedUsers = this.connectedUsers.filter((el) => el.id === user.id)
  }

  @OnMessage('/save')
  @EmitOnSuccess('new-message')
  save(@ConnectedSocket() socket: any, @MessageBody() message: any) {
    socket.broadcast.emit('new-message', message)
  }

  @OnMessage('choice-character')
  playerChoiceCharacter(@ConnectedSocket() socket: any, @MessageBody() stringMessage: any) {
    const message: PlayerChoiceCharacterParamInterface = JSON.parse(stringMessage)
    const roomHash = socket.handshake.roomHash

    if (!message.gameClass || !roomHash) return

    const playerRoom = this.activeGameRooms.find((room) => room.hash === roomHash)

    if (!playerRoom) return

    const playerClass = getClassForName(message.gameClass)

    playerRoom.onPlayerChoiceCharter(socket.handshake.user.id, playerClass)
  }

  @OnMessage('/add-to-friends')
  async addToFriends(@ConnectedSocket() socket: any, @MessageBody() stringMessage: any) {
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
  async searchRoom (@ConnectedSocket() socket: any, @MessageBody() stringMessage: any, @SocketIO() io: any) {
    const message: SearchRoomParamInterface = JSON.parse(stringMessage)
    if (socket.handshake.roomHash !== 'main-menu') {
      socket.emit('game-error', 'Для поиска игры вы должны находиться в главном меню. Если вы видите это сообщение, находясь в нём, пожалуйста, перезагрузите игру')
      return
    }

    if (!message.mode) {
      socket.emit('game-error', 'Укажите режим, в котором хотите играть')
      return
    }

    const user: JoinToRoomUserParamInterface = {
      user: socket.handshake.user,
    }

    const suitableRooms = this.activeGameRooms.filter((room) => {
      if (room.isCanJoin && room.gameMode === message.mode) {
       return room
      }
    })

    if (!suitableRooms.length) {
      const room = await this.createRoom(io, { gameMode: message.mode })

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

  async createRoom(io: any, roomData: CreateRoomparamInterface) {
    const createRoomHash = async () => {
      const hash = await createRandomString()

      const isRoomHashExists = this.activeGameRooms.find(room => room.hash === hash)

      if (isRoomHashExists) return createRoomHash()
      else return hash
    }

    const roomHash = await createRoomHash()

    const room = new RommEntity({
      hash: roomHash,
      gameMode: roomData.gameMode,
      gameTime: 240,
      gameSocket: io,
      roomCreatedTime: Date().toString()
    })

    this.activeGameRooms.push(room)

    return room
  }
}
