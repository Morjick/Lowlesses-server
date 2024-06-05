import { ForumCommentModel } from './ForumCommentMode'
import { ForumThemeModel } from './ForumThemeModel'
import { UserModel } from './UserModel'
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript'
import { EquipmentModel } from './EquipmentModel'
import { LocaleListType } from '../data/contracts/global.contracts'

@Table
export class ForumArticleModel extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  @Column({ type: DataType.STRING, unique: true })
  title: string

  @Column({ type: DataType.STRING, unique: true })
  description: string

  @Column({ type: DataType.TEXT })
  body: string

  @Column({ type: DataType.STRING, unique: true })
  slug: string

  @Column({ type: DataType.ENUM('ru-RU', 'en-EN') })
  locale: LocaleListType

  @Column({ type: DataType.INTEGER })
  views: number

  @Column({ type: DataType.ARRAY(DataType.STRING) })
  tags: string[]

  @Column({ type: DataType.BOOLEAN })
  isModeration: boolean

  @Column({ type: DataType.BOOLEAN })
  isShow: boolean

  @Column({ type: DataType.INTEGER })
  moderatorId: number

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER })
  autorId: number

  @BelongsTo(() => UserModel)
  autor: UserModel

  @ForeignKey(() => ForumThemeModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  themeId: number

  @BelongsTo(() => ForumThemeModel)
  theme: ForumThemeModel

  @HasMany(() => ForumCommentModel, /* foreign key */ 'articleId')
  comments: ForumCommentModel[]
}
