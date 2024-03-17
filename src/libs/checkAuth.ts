
import * as jwt from 'jsonwebtoken'
import { OpenUserDataInterface, UserModel, UsersFriendsModel } from '../models/UserSchema';
import { FriendRelatedModel } from '../models/FriendRelatedModel';
require('dotenv').config()

interface ResponseCheckAuthInterface {
  message: string
  ok: boolean
  status: number
  user?: OpenUserDataInterface
}

export const checkToken = async (token: string, isOnline = true): Promise<ResponseCheckAuthInterface> => {
  const secretKey = process.env.JWT_SECRET_KEY

  try {
    const { id } = jwt.verify(token, secretKey, {
      secret: secretKey,
    })

    if (!id) {
      return {
        message: 'Не удалось подтвердить авторизацию',
        ok: false,
        status: 401,
      };
    }

    await UserModel.update({ isOnline, }, { where: { id: id } })
    const user = await UserModel.findOne({
      where: { id },
      attributes: {
        exclude: ['password', 'createdAt', 'updatedAt'],
      },
      include: [
        {
          model: UsersFriendsModel,
          attributes: { 
            exclude: ['password', 'createdAt', 'updatedAt'], 
          },
          include: [
            {
              model: FriendRelatedModel,
              attributes: { 
                exclude: ['password', 'createdAt', 'updatedAt', 'money', 'kills', 'deaths', 'friendsListId'], 
              },
              include: [ { 
                model: UserModel, 
                attributes: { 
                  exclude: ['password', 'createdAt', 'updatedAt', 'money', 'kills', 'deaths', 'friendsListId'], 
                },
              }]
            }
          ]
        }
      ]
    })

    if (!user) {
      return {
        message: 'Авторизация не подтверждена',
        ok: false,
        status: 402
      }
    }

    const userOpenData = {
      ...user.dataValues,
      friends: user.dataValues.friendList?.dataValues
      ? user.dataValues.friendList.dataValues.friends.map((el) => el.dataValues.user.dataValues)
      : [],
    }

    if (!userOpenData.friends.friendsId) {
      userOpenData.friends.friendsId = []
    }

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