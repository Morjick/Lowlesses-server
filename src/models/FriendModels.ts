import { DataTypes, Sequelize } from 'sequelize'
import { connectionString } from '../data/DataBase'

const sequelize = new Sequelize(`${connectionString}`)

export const FriendSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
}

export const FriendModel = sequelize.define('Friends', FriendSchema)
