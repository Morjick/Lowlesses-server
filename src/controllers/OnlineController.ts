import {
  SocketController,
  OnMessage,
  ConnectedSocket,
  MessageBody,
  EmitOnSuccess,
  OnConnect,
  OnDisconnect,
} from 'socket-controllers';
import { checkToken } from '../libs/checkAuth';
import { Service } from 'typedi';
import { getTokenSromSocket } from '../libs/getTokenSromSocket';
import { FriendEntiry } from '../entities/FriendEntiry';
import { UserEntity } from '../entities/UserEntity';

@SocketController()
@Service()
export class OnlineController {
  @OnConnect()
  async connect(@ConnectedSocket() socket: any, @MessageBody() message: any) {
    try {
      const userToken = getTokenSromSocket(socket)
      if (!userToken) return

      const { user } = await checkToken(userToken)

      socket.handshake.user = user
      socket.handshake.user.isAuth = true
    } catch(e) {
      console.log(e)
    }
  }

  @OnDisconnect()
  async disconnect(@ConnectedSocket() socket) {
    const userToken = getTokenSromSocket(socket)
    if (!userToken) return

    const { user } = await checkToken(userToken)
    const userEntity = new UserEntity({ id: user.id, details: user })
    await userEntity.disconnect()
  }

  @OnMessage('/save')
  @EmitOnSuccess('new-message')
  save(@ConnectedSocket() socket: any, @MessageBody() message: any) {
    socket.broadcast.emit('new-message', message)
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
}
