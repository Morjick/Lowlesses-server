import { CreateUserInterface, SetUserInvitedHashInterface, UserModel, UsersFriendsModel } from '../models/UserSchema'
import { Body, Post, JsonController, UseBefore, Req } from 'routing-controllers'
import * as bcrypt from 'bcrypt'
import 'reflect-metadata'
import { IsValidPassword } from '../libs/isValidVassword'
import * as jwt from 'jsonwebtoken'
import { Model } from 'sequelize'
import { secretKey } from '../data/DataBase'
import { checkToken } from '../libs/checkAuth'
import { createRandomString } from '../libs/createRandomString'
import { AuthMiddleware } from '../middleware/AuthMiddleware'



@JsonController ('/user')
export class UserController {
  @Post('/create-user')
  async createUser(@Body() body: CreateUserInterface) {
    if (!body.username?.length || !body.password?.length) {
      return {
        status: 304,
        message: 'Пожалуйста, заполните все поля',
        error: 'Пожалуйста, заполните все поля'
      }
    }

    const isUsernameExists = await UserModel.findOne({ where: { username: body.username } })

    if (isUsernameExists?.dataValues?.id) {
      return {
        status: 409,
        message: 'Персонаж с таким именем уже существует',
        error: 'Персонаж с таким именем уже существует'
      }
    }

    const isPasswordValid = await IsValidPassword(
      body.password,
      body.username,
    )

    if (!isPasswordValid.ok) {
      return {
        message: isPasswordValid.message,
        status: 401,
      }
    }

    const hashPassword = await bcrypt.hash(body.password, 10)
    const userHash = await createRandomString()

    const user = await UserModel.create({
      username: body.username,
      password: String(hashPassword),
      userHash,
    })

    const friendList = await UsersFriendsModel.create({ userId: user.dataValues.id })

    UserModel.update({ friendsListId: user.dataValues.id }, { where: { id: user.dataValues.id } })


    const token: Model = await jwt.sign(
      {
        id: user.dataValues.id,
        name: user.dataValues.username,
      },
      secretKey,
      {
        expiresIn: '15d',
      },
    )

    return {
      body: {
        token,
        user: user.dataValues,
        friendList,
      },
      status: 200,
      message: 'Пользователь создан'
    }
  }

  @Post('/login')
  async login (@Body() body: CreateUserInterface) {
    const user = await UserModel.findOne({
      where: { username: body.username },
    })

    if (!user) {
      return {
        message: 'Пользователь с таким именем не найден',
        status: 404,
        ok: false,
      }
    }

    const isPassword = await bcrypt.compare(body.password, user.dataValues.password)

    if (!isPassword) {
      return {
        message: 'Указан не верный пароль',
        status: 301,
        ok: false,
      }
    }


    const token = jwt.sign(
      {
        id: user.dataValues.id,
        name: user.dataValues.username,
      },
      secretKey,
      { expiresIn: '15d' }
    )

    return {
      message: 'Авторизация подтверждена',
      body: {
        token,
        user: user.dataValues,
      },
      status: 200,
    }
  }

  @Post('/check-token')
  async checkToken(@Body() body) {
    const { token } = body
    const { user } = await checkToken(token)

    return {
      message: 'Авторизация подтверждена',
      ok: true,
      body: {
        user
      }
    }
  }

  @Post('/set-user-hash')
  @UseBefore(AuthMiddleware)
  async setUserInvatedHash(@Body() body: SetUserInvitedHashInterface, @Req() request) {
    const VIPGiftDays = 7

    const user = request.user
    const { invitedHash } = body

    const dateEnd = new Date()
    dateEnd.setDate(dateEnd.getDate() + VIPGiftDays)

    if (user.invitedHash?.length) {
      return {
        status: 402,
        message: 'У вас уже установлен реферальный код',
        error: 'У вас уже установлен реферальный код',
      }
    }

    const referal = await UserModel.findOne({ where: { userHash: invitedHash } })
    
    if (!referal) {
      return {
        status: 404,
        message: 'Пользователь с таким реферальным кодом не найден',
        error: 'Пользователь с таким реферальным кодом не найден',
      }
    }

    let referalVIPDateEnd = null

    if (referal.dataValues.endVIPDate) {
      referalVIPDateEnd = new Date(referal.dataValues.endVIPDate)
    } else {
      referalVIPDateEnd = new Date()
    }

    referalVIPDateEnd.setDate(dateEnd.getDate() + VIPGiftDays)

    await UserModel.update({ invitedHash, endVIPDate: dateEnd }, { where: { id: user.id } })
    await UserModel.update({ endVIPDate: referalVIPDateEnd, isVIPStatus: true }, { where: { id: referal.dataValues.id } })

    return {
      ok: true,
      status: 200,
      message: 'Реферальный код указан'
    }
  }

  async setOnlinestatus (id, isOnlien) {
    await UserModel.update({ isOnlien }, { where: { id } })
  }
}
