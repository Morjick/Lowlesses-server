import { UserModel } from './UserModel';
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


@Table
export class NewsModel extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  @Column({ type: DataType.STRING, unique: true, allowNull: false, })
  titleRU: string

  @Column({ type: DataType.STRING, unique: true, allowNull: false, })
  titleEN: string

  @Column({ type: DataType.TEXT, })
  bodyRU: string

  @Column({ type: DataType.TEXT, })
  bodyEN: string

  @Column({ type: DataType.TEXT })
  descriptionRU: string

  @Column({ type: DataType.TEXT })
  descriptionEN: string

  @Column({ type: DataType.STRING })
  publicData: string

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isShow: boolean

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isMainNews: boolean

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  slug: string

  @Column({ type: DataType.STRING })
  avatar: string

  @Column({ type: DataType.ARRAY(DataType.STRING) })
  tags: string[]

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER })
  autorId: number

  @BelongsTo(() => UserModel)
  autor: UserModel
}
