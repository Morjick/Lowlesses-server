import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript'
import { UsersFriendsModel } from './UserFriendsModel'
import { OpenUserDataInterface } from './UserSchema'
import { CoordsInterface } from '../data/GameMaps'
import {
  GameClassInterface,
  // GameClasses,
  // PlayerClassType,
} from '../data/game-classes/GameClass'

export type UserRoleType = 'USER' | 'ADMIN' | 'ROOT' | 'MODERATOR'
export type PlayerStatusTpye = 'online' | 'ofline'
export type PlayerAnimationType = 'run' | 'idle' | 'attack' | 'jump'
export type PlayerComandType = 'blue' | 'red' | 'any'

export interface PlayerPositionInterface {
  coords: CoordsInterface
  isFlipX: boolean
}

export interface PlayerInterface {
  user: OpenUserDataInterface
  className?: GameClassInterface
  kills: number
  dies: number
  isAlive: boolean
  position?: PlayerPositionInterface
  animation?: PlayerAnimationType
  command: PlayerComandType
}

export const userGameClassData = {
  classes: [],
  everyDayQuests: {
    list: [],
    date: new Date().toLocaleString('ru').split(', ')[0],
  },
}

@Table
export class UserModel extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  @Column({ type: DataType.STRING, unique: true })
  username: string

  @Column({ type: DataType.STRING })
  password: string

  @Column({ type: DataType.INTEGER, defaultValue: 1000 })
  money: number

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  kills: number

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  deaths: number

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isOnline: boolean

  @Column({
    type: DataType.ENUM('USER', 'ADMIN', 'ROOT', 'MODERATOR'),
    defaultValue: 'USER',
  })
  role: UserRoleType

  @ForeignKey(() => UsersFriendsModel)
  @Column({ type: DataType.INTEGER })
  friendsListId: number

  @BelongsTo(() => UsersFriendsModel)
  friendList: UsersFriendsModel

  @Column({ type: DataType.STRING })
  userHash: string

  @Column({ type: DataType.STRING })
  invitedHash: string

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isReferalGiftReceived: boolean

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isVIPStatus: boolean

  @Column({ type: DataType.DATE })
  endVIPDate: string

  @Column({
    type: DataType.JSON,
    defaultValue: JSON.stringify(userGameClassData),
  })
  userLockedData: string

  @Column({ type: DataType.STRING })
  email: string

  @Column({ type: DataType.STRING })
  firstname: string

  @Column({ type: DataType.STRING })
  lastname: string

  @Column({ type: DataType.STRING })
  patronomic: string

  @Column({ type: DataType.STRING })
  avatar: string

  @Column({ type: DataType.STRING })
  slug: string

  @Column({ type: DataType.STRING })
  developerRoleRU: string

  @Column({ type: DataType.STRING })
  developerRoleRN: string

  @Column({ type: DataType.STRING })
  telegram: string

  @Column({ type: DataType.STRING })
  vk: string

  @Column({ type: DataType.STRING })
  whatsapp: string

  @Column({ type: DataType.STRING })
  discord: string
}
