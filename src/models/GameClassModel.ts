import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript'
import { PlayerClassType } from 'src/data/game-classes/GameClass'
import { GameSkillModel } from './GameSkillModel'

@Table
export class GameClassModel extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  @Column({
    type: DataType.ENUM(
      'KNIGHT',
      'PRIEST',
      'ARCHER',
      'PALADIN',
      'ROGUE',
      'BARBARIAN',
      'MAGE',
      'WARLOCK',
      'DRUID',
      'SHAMAN'
    ),
  })
  name: PlayerClassType

  @Column({ type: DataType.INTEGER })
  hp: number

  @Column({ type: DataType.INTEGER })
  speed: number

  @Column({ type: DataType.INTEGER })
  attackPower: number

  @Column({ type: DataType.INTEGER, defaultValue: 800 })
  classPrice: number

  @HasMany(() => GameSkillModel)
  skills: GameClassModel[]
}
