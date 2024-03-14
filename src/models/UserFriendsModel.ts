import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript'
import { UserModel } from './UserModel'
import { FriendRelatedModel } from './FriendRelatedModel'

@Table
export class UsersFriendsModel extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  // @ForeignKey(() => UserModel)
  @Column({ type: DataType.ARRAY(DataType.INTEGER) })
  friendsId: number[]

  @HasMany(() => FriendRelatedModel)
  friends: FriendRelatedModel[]

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER })
  userId: number
}
