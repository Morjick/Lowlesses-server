import { checkToken } from './../libs/checkAuth'
import {
  ConnectedSocket,
  MessageBody,
  OnConnect,
  OnMessage,
  SocketController,
} from "socket-controllers"
import { getTokenSromSocket } from "../libs/getTokenSromSocket"
import { Service } from "typedi"
import { AppealInterface, CreateAppealInterface } from '../data/contracts/admin.contracts'
import { OpenUserDataInterface } from '../models/UserSchema'

@SocketController('/communication')
@Service()
export class AdminController {
  appeals: AppealInterface[] = []

  @OnConnect()
  async connect (@ConnectedSocket() socket: any) {
    const userToken = getTokenSromSocket(socket)

    if (!userToken) {
      socket.emit('game-message', {
        message: 'Для данного метода вы должны быть авторизованы',
        status: 401
      })
      return
    }

    const { user } = await checkToken(userToken)

    socket.handshake.user.isAuth = true
    socket.handshake.user = user
  }

  @OnMessage('/create-appeal')
  async createAppeal (@ConnectedSocket() socket: any, @MessageBody() message: string) {
    const body: CreateAppealInterface = JSON.parse(message)

    const appeal: AppealInterface = {
      ...body,
      user: socket.handshake.user,
      time: new Date().toLocaleString('ru'),
    }

    this.appeals = [...this.appeals, appeal]
  }

  @OnMessage('/get-appeals')
  async getAppeals (@ConnectedSocket() socket: any) {
    const user: OpenUserDataInterface = socket.handshake.user

    if (user.role === 'USER') {
      socket.emit('game-message', {
        message: 'Недостаточно прав',
        status: 402
      })
      return
    }

    socket.emit('get-appeals', this.appeals)
  }
}
