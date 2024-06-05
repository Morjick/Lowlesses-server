import { UserModel, UserRoleType } from './UserModel'
import { UsersFriendsModel } from './UserFriendsModel'
import { GameClassInterface } from '../data/game-classes/GameClass'

interface CreateUserInterface {
  username: string
  password: string
}

interface UserFriendsListOpenDataInterface {
  id: number
  friendsId: number[]
  userId: number
  createdAt: string
  updatedAt: string
}

interface FriendOpenDataInterface {
  id: number
  username: string
  isOnline: boolean
  role: UserRoleType
}

interface UserLockedDataInterface {
  classes: GameClassInterface[]
}

interface OpenUserDataInterface {
  id: number
  username: string
  kills: number
  dies: number
  friendsListId: number
  friends: FriendOpenDataInterface[]
  isAuth: boolean
  role: UserRoleType
  userLockedData: UserLockedDataInterface
  classes: GameClassInterface
  money: number
}

interface SetUserInvitedHashInterface {
  invitedHash: string
}

interface UpdateUserDataInterface {
  username: string
  firstname: string
  lastname: string
  patronomic: string
  telegram: string
  vk: string
  whatsapp: string
  discord: string
}

export {
  UserModel,
  UsersFriendsModel,
  type OpenUserDataInterface,
  type CreateUserInterface,
  type SetUserInvitedHashInterface,
  type UserLockedDataInterface,
  type UpdateUserDataInterface,
}
