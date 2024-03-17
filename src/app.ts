import { createExpressServer } from "routing-controllers"
import { UserController } from "./controllers/UserController"
import { GlobalResponseInterceptor } from "./interceptors/GlobalResponseInterceptor"
import { SocketControllers } from "socket-controllers"
import { OnlineController } from "./controllers/OnlineController"
import { Container } from "typedi"
import { connectToDataBase } from "./data/DataBase"
import { ShopController } from "./controllers/ShopController"

const init = async () => {
  const port = process.env.PORT
  const socetPort = Number(process.env.SOCKET_PORT)

  await connectToDataBase({
    HOST: process.env.DB_HOST,
    USER: process.env.DB_USERNAME,
    PASWORD: process.env.DB_PASSWORD,
    DB: process.env.DB_NAME,
    PORT: process.env.DB_PORT,
  })

  const app = createExpressServer({
    controllers: [UserController, ShopController],
    interceptors: [GlobalResponseInterceptor],
    cors: {
      methods:"GET,HEAD,PUT,PATCH,POST,DELETE",
      allowedHeaders:"Origin,X-Requested-With,Content-Type,Accept, Accept-Encoding,Accept-Language,Authorization,Content-Length,Host,Referer,User-Agent",
      exposedHeaders:"Origin,X-Requested-With,Content-Type,Accept, Accept-Encoding,Accept-Language,Authorization,Content-Length,Host,Referer,User-Agent",
      credentials:true,
      optionsSuccessStatus: 200
    }
  })

  new SocketControllers({
    port: socetPort,
    controllers: [OnlineController],
    container: Container,
  })


  app.listen(port, () => {
    console.log(`Приложение запущенно на порту ${port}`)
  })
}

init()
