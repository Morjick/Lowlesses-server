import { Sequelize } from "sequelize-typescript"
import { UserModel, UsersFriendsModel } from "../models/UserSchema"
import { FriendRelatedModel } from "../models/FriendRelatedModel"
import { EquipmentModel } from "../models/EquipmentModel"
import { CreateRootUser } from "./scripts/CreateRootUser"
import { BaffsModel } from "../models/BaffsModel"
import { GameSkillModel } from "../models/GameSkillModel"
import { GameClassModel } from "../models/GameClassModel"
import { NewsModel } from "../models/NewsModel"
import { getGameClassesFromDB } from "./game-classes/GameClass"
import { ForumThemeModel } from "../models/ForumThemeModel"
import { ForumArticleModel } from "../models/ForumArticleModel"

require('dotenv').config()

interface DataBaseConstructorInterface {
  HOST: string | number
  USER: string
  PASWORD: string
  DB: string
  PORT: string | number
}

const connectionString = `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
const secretKey = process.env.JWT_SECRET_KEY

const connectToDataBase = async (data: DataBaseConstructorInterface) => {
  const dataBaseConfig = {
    HOST: data.HOST,
    USER: data.USER,
    PASSWORD: data.PASWORD,
    DB: data.DB,
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    }
  }

  const database = new Sequelize(dataBaseConfig.DB, dataBaseConfig.USER, String(dataBaseConfig.PASSWORD), {
    host: String(dataBaseConfig.HOST),
    dialect: "postgres",
    pool: {
      max: dataBaseConfig.pool.max,
      min: dataBaseConfig.pool.min,
      acquire: dataBaseConfig.pool.acquire,
      idle: dataBaseConfig.pool.idle
    },
    logging: false,
    port: Number(data.PORT),
    models: [
      UserModel,
      UsersFriendsModel,
      FriendRelatedModel,
      EquipmentModel,
      BaffsModel,
      GameSkillModel,
      GameClassModel,
      NewsModel,
      ForumThemeModel,
      ForumArticleModel,
    ],
  })


  try {
    await database.authenticate()
    await database.sync({ alter: false, })
    await CreateRootUser()
    await getGameClassesFromDB()
    // await createGameShop()
  } catch(e) {
    console.error('Ошибка при подключении к базе данных', e)
    throw new Error(e)
  }

  return {
    // UserModel
  }
}

export { connectToDataBase, type DataBaseConstructorInterface, connectionString, secretKey }
