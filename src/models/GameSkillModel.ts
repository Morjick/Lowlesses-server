import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript'
import { SkillLevelType } from 'src/data/game-classes/GameClass'
import { GameClassModel } from './GameClassModel'

@Table
export class GameSkillModel extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  @Column({ type: DataType.STRING, })
  name: string

  @Column({ type: DataType.INTEGER })
  damage: number

  @Column({ type: DataType.INTEGER })
  cooldown: number

  @Column({ type: DataType.BOOLEAN })
  isMassive: boolean

  @Column({ type: DataType.ENUM('0', '1', '2', '3') })
  skillLevel: SkillLevelType

  @Column({ type: DataType.BOOLEAN })
  isHaveEffect: boolean

  @Column({ type: DataType.INTEGER })
  @ForeignKey(() => GameClassModel)
  gameClassId: number

  @Column({ type: DataType.INTEGER, defaultValue: 500 })
  skillPrive: number

  @Column({ type: DataType.INTEGER, defaultValue: 1500 })
  updateSkillPrice: number
}
