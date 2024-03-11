import { DataTypes, Sequelize } from "sequelize"
import { connectionString } from "../data/DataBase"

const sequelize = new Sequelize(`${connectionString}`)

export const UserSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  money: {
    type: DataTypes.INTEGER,
    defauotValue: 1000
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
}

export const UserModel = sequelize.define('User', UserSchema)

export interface CreateUserInterface {
  username: string
  password: string
}
