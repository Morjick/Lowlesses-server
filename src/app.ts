// docs
const swagger = require('swagger-ui-express')
const UserDocs = require('./docs/user.docs.json')
const NewsDocs = require('./docs/news.docs.json')
const ForumDocs = require('./docs/forum.docs.json')

// static
const multer  = require('multer')
import * as path from 'path'

// modules
import { createExpressServer } from "routing-controllers"
import { UserController } from "./controllers/UserController"
import { GlobalResponseInterceptor } from "./interceptors/GlobalResponseInterceptor"
import { SocketControllers } from "socket-controllers"
import { OnlineController } from "./controllers/OnlineController"
import { Container } from "typedi"
import { connectToDataBase } from "./data/DataBase"
import { ShopController } from "./controllers/ShopController"
import { HeroesController } from "./controllers/HeroesController"
import { NewsController } from "./controllers/NewsController"
import { ForumController } from "./controllers/ForumController"

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
    controllers: [UserController, ShopController, NewsController, ForumController],
    interceptors: [GlobalResponseInterceptor],
    cors: {
      methods:"GET,HEAD,PUT,PATCH,POST,DELETE",
      allowedHeaders:"Origin,X-Requested-With,Content-Type,Accept, Accept-Encoding,Accept-Language,Authorization,Content-Length,Host,Referer,User-Agent",
      exposedHeaders:"Origin,X-Requested-With,Content-Type,Accept, Accept-Encoding,Accept-Language,Authorization,Content-Length,Host,Referer,User-Agent",
      credentials:true,
      optionsSuccessStatus: 200
    },
    classTransformer: true,
  })

  new SocketControllers({
    port: socetPort,
    controllers: [OnlineController, HeroesController],
    container: Container,
  })

  app.use('/api-docs-news/', swagger.serve, swagger.setup(NewsDocs))
  app.use('/api-docs-user/', swagger.serve, swagger.setup(UserDocs))
  app.use('/api-docs-forum/', swagger.serve, swagger.setup(ForumDocs))
  
  // static
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'static/')
    },
    filename: function (req, file, cb) {
      const fileNameDots = String(file.originalname).split('.')
      const fileExtention = fileNameDots[fileNameDots.length - 1]

      const uniqueString = `file-${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExtention}`
      cb(null, uniqueString)
    }
  })
  const upload = multer({ dest: 'static/', storage })

  app.post('/upload-image', upload.single('file'), (req, res, next) => {
    const file = req.file
    // console.log(file.mimetype)
    
    // if (file.mimetype !== 'image/jpeg' || file.mimetype !== 'image/png') return res.status(200).json({
    //   status: 400,
    //   message: 'Изображения подобного формата не поддерживаются',
    // })

    res.status(200).json({
      status: 200,
      message: 'Изображение было загружено',
      body: {
        path: file.filename,
      }
    })
  })

  app.get('/get-image/:path', async (req, res) => {
    try {
      const imagePath = req.params.path
    
      res.sendFile(`${imagePath}`, { root: path.join(__dirname, '../static') })
    } catch (e) {
      console.log('error to send file', e)

      res.status(501).json({
        message: 'Ошибка в получении файла',
        status: 501,
        error: e,
      })
    }
  })

  app.listen(port, () => {
    console.log(`Приложение запущенно на порту ${port}`)
  })
}

init()
