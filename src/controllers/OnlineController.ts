import { SocketController, OnMessage, ConnectedSocket, MessageBody, EmitOnSuccess, OnConnect, OnDisconnect } from 'socket-controllers';
import { Service } from 'typedi';

@SocketController()
@Service()
export class OnlineController {
  @OnConnect()
  connect (@ConnectedSocket() socket: any, @MessageBody() message: any) {
    console.log('i am here', message)
    socket.emit('save_success')
  }

  @OnDisconnect()
  disconnect(@ConnectedSocket() socket) {
    socket.emit('good by')
  }

  @OnMessage('save')
  @EmitOnSuccess('save_successfully')
  save (@MessageBody() message: any) {
    console.log('i am here', message)
  }
}
