import { MiddlewareInterface, Middleware } from "socket-controllers"
import { Socket } from "socket.io"
import { Service } from "typedi"


// ! NOT WORKING
@Service('SocketAuthMiddleware')
@Middleware({ namespace: 'SocketAuthMiddleware' })
export class SocketAuthMiddleware implements MiddlewareInterface {

  use(socket: Socket, next: Function): void {
    console.log('user socket: ', socket)
    // const token = <string>socket.request.headers['x-api-token']

    // if(!token?.length) {
    //     console.error('Пользователь отключён, так как не прошёл проверку авторизации')
    //     next(new Error('Не далось авторизоваться'))
    // }
    // console.log('Пользователь подключен')

    next()
  }
}
