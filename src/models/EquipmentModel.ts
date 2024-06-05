import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript'
import { BaffsModel, CreateBaffInterface } from './BaffsModel'

export type EquipmentType = 'ARTEFACT' | 'RING' | 'BOOTS'
export interface CreateEquipmentItemInterface {
  title: string
  price: number
  discount?: number
  avatar?: string
  type: EquipmentType
  baffs?: CreateBaffInterface[]
}

@Table
export class EquipmentModel extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  @Column({ type: DataType.STRING, unique: true })
  title: string

  @Column({ type: DataType.INTEGER })
  price: number

  @Column({ type: DataType.INTEGER })
  discount: number

  @Column({ type: DataType.ENUM('RING', 'BOOTS', 'ARTEFACT') })
  equipmentType: EquipmentType

  @Column({ type: DataType.STRING })
  avatar: string

  @HasMany(() => BaffsModel, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    hooks: true,
  })
  bonus: BaffsModel[]
}
