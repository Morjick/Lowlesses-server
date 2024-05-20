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
export class ForumThemeModel extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  @Column({ type: DataType.ARRAY(DataType.STRING) })
  tags: string[]

  @Column({ type: DataType.STRING })
  avatar: string

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  titleRU: string

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  titleEN: string
  
  @Column({ type: DataType.STRING })
  descriptionEN: string
  
  @Column({ type: DataType.STRING })
  descriptionRU: string

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER })
  autorId: number

  @BelongsTo(() => UserModel)
  autor: UserModel
}
