import { UserModel, UserRoleType } from "./UserModel"
import { UsersFriendsModel } from "./UserFriendsModel"

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

interface OpenUserDataInterface {
  id: number
  username: string
  kills: number
  dies: number
  friendsListId: number
  friends: FriendOpenDataInterface[]
  isAuth: boolean
  role: UserRoleType
}

export {
  UserModel,
  UsersFriendsModel,
  type OpenUserDataInterface,
  type CreateUserInterface,
} 
