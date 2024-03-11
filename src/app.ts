import express, { RequestHandler } from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import { createExpressServer } from "routing-controllers";
import { UserController } from "./controllers/UserController";
import { GlobalResponseInterceptor } from "./interceptors/GlobalResponseInterceptor";
import { SocketControllers } from "socket-controllers";
import { OnlineController } from "./controllers/OnlineController";
import { Container } from "typedi";
import { connectToDataBase } from "./data/DataBase";
import bodyParser from 'body-parser'

const init = async () => {
  dotenv.config();

  const port = process.env.PORT;
  const socetPort = Number(process.env.SOCKET_PORT);

  await connectToDataBase({
    HOST: process.env.DB_HOST,
    USER: process.env.DB_USERNAME,
    PASWORD: process.env.DB_PASSWORD,
    DB: process.env.DB_NAME,
    PORT: process.env.DB_PORT,
  });

  const app = createExpressServer({
    controllers: [UserController],
    interceptors: [GlobalResponseInterceptor],
    cors: {
      methods:"GET,HEAD,PUT,PATCH,POST,DELETE",
      allowedHeaders:"Origin,X-Requested-With,Content-Type,Accept, Accept-Encoding,Accept-Language,Authorization,Content-Length,Host,Referer,User-Agent",
      exposedHeaders:"Origin,X-Requested-With,Content-Type,Accept, Accept-Encoding,Accept-Language,Authorization,Content-Length,Host,Referer,User-Agent",
      credentials:true,
      optionsSuccessStatus: 200
    }
  });

  new SocketControllers({
    port: socetPort,
    controllers: [OnlineController],
    container: Container,
  });
  const server = http.createServer(app);
  const io = new Server(server);

  let onlineUsersCount = 0;

  io.on("connection", (socket) => {
    onlineUsersCount++;
    console.log(`hi, online ${onlineUsersCount}`);
    socket.emit(`hi, online ${onlineUsersCount}`);
  });

  // io.listen(Number(socetPort))
  app.listen(port, () => {
    console.log(`Running on port ${port}`);
  });
};

init();
