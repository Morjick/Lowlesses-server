import { Sequelize } from "sequelize"
import { config } from 'dotenv'
import { UserModel } from "../models/UserSchema"

config()

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
    sync: {
      alter: true,
      force: true,
    },
    logging: false,
    port: Number(data.PORT),
  })


  try {
    database.authenticate()
    await database.sync({ force: true, alter: true, }).then(() => {})
  } catch(e) {
    console.error('Ошибка при подключении к базе данных', e)
  }

  return {
    // UserModel
  }
}

export { connectToDataBase, type DataBaseConstructorInterface, connectionString, secretKey }
