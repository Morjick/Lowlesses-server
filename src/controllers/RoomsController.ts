import { ConnectedSocket, MessageBody, OnConnect, SocketController, } from 'socket-controllers';
import { Service } from 'typedi';

@SocketController('/rooms')
@Service()
export class RoomsController {
  @OnConnect()
  async connect(@ConnectedSocket() socket: any, @MessageBody() message: any) {
    socket.emit("save_success");
  }

  async createRoom(@ConnectedSocket() socket: any, @MessageBody() message: any) {

  }
}
