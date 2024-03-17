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

export type BaffsFieldsEType = 'HP' | 'DAMAGE' | 'SPEED' | 'JumpCount'
export type BaffsActionTpye = 'SUBTRACTION' | 'ADDITION'
export interface CreateBaffInterface {
  field: BaffsFieldsEType
  action: BaffsActionTpye
  value: number
}

@Table
export class BaffsModel extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  @Column({ type: DataType.ENUM('HP', 'DAMAGE', 'SPEED', 'JumpCount') })
  field: BaffsFieldsEType
  
  @Column({ type: DataType.ENUM('SUBTRACTION', 'ADDITION') })
  action: BaffsActionTpye

  @Column({ type: DataType.STRING })
  value: string

  @ForeignKey(() => EquipmentModel)
  @Column({ type: DataType.INTEGER })
  equipmentId: number
}
