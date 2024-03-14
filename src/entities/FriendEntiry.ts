import { FriendRelatedModel } from "../models/FriendRelatedModel"
import { OpenUserDataInterface, UserModel, UsersFriendsModel } from "../models/UserSchema"

export type FriendEntiryActionType = 'add' | 'remove'

export interface FriendEntiryCreateParamsInterface {
  friendUsername: string
  action?: FriendEntiryActionType
  user: OpenUserDataInterface
}

export interface FriendEntiryMethodResponseInterface {
  ok: boolean
  status: number
  message: string
  error?: any
  body?: any
}

export class FriendEntiry {
  constructor (data: FriendEntiryCreateParamsInterface) {
    this.friendUsername = data.friendUsername
    this.action = data.action || null
    this.user = data.user
  }

  userToken = null
  friendUsername = null
  action = null
  user: OpenUserDataInterface = null

  async add (): Promise<FriendEntiryMethodResponseInterface> {

    const candidat = await UserModel.findOne(
      { where: { username: this.friendUsername },
      attributes: ['username', 'isOnline', 'role', 'id']
    })

    if (!candidat?.id) {
      return {
        ok: false,
        status: 404,
        message: 'Пользователь не найден'
      }
    }

    console.log(this.user)
    const isFriendExists = this.user.friends.find((friend) => {
      return friend.id === candidat.id
    })

    if (isFriendExists) {
      return {
        ok: false,
        status: 409,
        message: 'Пользователь уже в списке друзей'
      }
    }

    const friends = [...this.user.friends, candidat]
    const friendRelated = await FriendRelatedModel.create({ userId: candidat.id, friendListId: this.user.friendsListId  })

    return {
      ok: true,
      status: 200,
      message: 'Пользователь добавлен в список друзей',
      body: {
        friends,
        user: this.user
      }
    }
  }
}
