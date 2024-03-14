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
import { UsersFriendsModel } from './UserFriendsModel'

@Table
export class FriendRelatedModel extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  @ForeignKey(() => UsersFriendsModel)
  @Column({ type: DataType.INTEGER })
  friendListId: number

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER })
  userId: number

  @BelongsTo(() => UserModel)
  user: UserModel
}
