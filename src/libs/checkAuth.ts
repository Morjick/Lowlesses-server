
import * as jwt from 'jsonwebtoken'
import { OpenUserDataInterface, UserModel, UsersFriendsModel } from '../models/UserSchema'
import { FriendRelatedModel } from '../models/FriendRelatedModel'
import { getGamseClassesFromUser } from '../data/game-classes/GameClass'
require('dotenv').config()

interface ResponseCheckAuthInterface {
  message: string
  ok: boolean
  status: number
  user?: OpenUserDataInterface
  error?: string
}

export const checkToken = async (token: string, isOnline = true): Promise<ResponseCheckAuthInterface> => {
  const secretKey = process.env.JWT_SECRET_KEY

  try {
    if (!token || !token.length) return {
      message: 'Не удалось подтвердить авторизацию',
      ok: false,
      status: 401,
      error: 'Нет токена авторизации',
    }

    const { id } = jwt.verify(token, secretKey, {
      secret: secretKey,
    })

    if (!id) {
      return {
        message: 'Не удалось подтвердить авторизацию',
        ok: false,
        status: 401,
      }
    }

    await UserModel.update({ isOnline, }, { where: { id: id } })
    const user = await UserModel.findOne({
      where: { id },
      attributes: {
        exclude: ['password', 'createdAt', 'updatedAt'],
      },
    })

    if (!user) {
      return {
        message: 'Авторизация не подтверждена',
        ok: false,
        status: 402
      }
    }
    console.log(user.dataValues.userLockedData)

    const userOpenData = {
      ...user.dataValues,
      friends: user.dataValues.friendList?.dataValues
        ? user.dataValues.friendList.dataValues.friends.map((el) => el.dataValues.user.dataValues)
        : [],
      userLockedData: typeof user.dataValues.userLockedData !== 'string' ? user.dataValues.userLockedData : JSON.parse(user.dataValues.userLockedData)
    }

    if (!userOpenData.friends.friendsId) {
      userOpenData.friends.friendsId = []
    }

    const classes = getGamseClassesFromUser(userOpenData)
    userOpenData.classes = classes
    userOpenData.userLockedData.classes = classes

    return {
      message: 'Авторизация подтверждена',
      ok: true,
      user: userOpenData,
      status: 200
    }
  } catch(e) {
    console.warn('Ошибка при подтверждении токена', e)
  }
}