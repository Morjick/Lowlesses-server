import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript'
import { UserModel } from './UserSchema'

@Table
export class ForumCommentModel extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  @Column({ type: DataType.STRING })
  message: string

  @Column({ type: DataType.BOOLEAN })
  isModerated: boolean

  @Column({ type: DataType.BOOLEAN })
  isEdited: boolean

  @Column({ type: DataType.STRING })
  publicDate: string

  @Column({ type: DataType.INTEGER })
  likes: number

  @Column({ type: DataType.INTEGER })
  dislikes: number

  @Column({ type: DataType.ARRAY(DataType.INTEGER) })
  likersID: number[]

  @Column({ type: DataType.ARRAY(DataType.INTEGER) })
  dislikersID: number[]

  @Column({ type: DataType.INTEGER })
  articleId: number

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER })
  moderatorId: number

  @BelongsTo(() => UserModel, 'moderatorId')
  moderator: UserModel

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER })
  autorId: number

  @BelongsTo(() => UserModel, 'autorId')
  autor: UserModel

  // @HasMany(() => ForumCommentModel, /* foreign key */ 'postId')
}
