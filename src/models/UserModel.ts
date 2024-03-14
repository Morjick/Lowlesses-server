import { connectionString } from "../data/DataBase"
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript'
import { UsersFriendsModel } from "./UserFriendsModel"
import { FriendRelatedModel } from "./FriendRelatedModel"

export type UserRoleType = 'USER' | 'ADMIN' | 'ROOT'

@Table
export class UserModel extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  @Column({ type: DataType.STRING })
  username: string

  @Column({ type: DataType.STRING })
  password: string

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  money: number

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  kills: number

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  deaths: number

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isOnline: boolean

  @Column({
    type: DataType.ENUM('USER', 'ADMIN', 'ROOT'),
    defaultValue: 'USER'
  })
  role: UserRoleType

  @ForeignKey(() => UsersFriendsModel)
  @Column({ type: DataType.INTEGER })
  friendsListId: number

  @BelongsTo(() => UsersFriendsModel)
  friendList: UsersFriendsModel
}
