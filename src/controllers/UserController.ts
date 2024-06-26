import { developerRoleList } from './../data/lists/developer-roles.list'
import {
  CreateUserInterface,
  SetUserInvitedHashInterface,
  UserModel,
  UsersFriendsModel,
  UpdateUserDataInterface,
} from '../models/UserSchema'
import {
  Body,
  Post,
  JsonController,
  UseBefore,
  Req,
  Get,
  Params,
  QueryParams,
} from 'routing-controllers'
import * as bcrypt from 'bcrypt'
import 'reflect-metadata'
import { IsValidPassword } from '../libs/isValidVassword'
import * as jwt from 'jsonwebtoken'
import { Model } from 'sequelize'
import { secretKey } from '../data/DataBase'
import { checkToken } from '../libs/checkAuth'
import { createRandomString } from '../libs/createRandomString'
import { AuthMiddleware } from '../middleware/AuthMiddleware'
import { UserRoleType } from '../models/UserModel'
import { developerList } from '../data/lists/developer.list'
import getTransplit from '../libs/getTranslate'
import { getToken } from '../libs/getToken'
import { UserAttributesForAdmin, UserAttributesForUser } from '../data/lists/users.list'
import { GetUsersQueryInterface } from '../data/contracts/user.contracts'

@JsonController('/user')
export class UserController {
  @Post('/create-user')
  async createUser(@Body() body: CreateUserInterface) {
    if (!body.username?.length || !body.password?.length) {
      return {
        status: 304,
        message: 'Пожалуйста, заполните все поля',
        error: 'Пожалуйста, заполните все поля',
      }
    }

    const isUsernameExists = await UserModel.findOne({
      where: { username: body.username },
    })

    if (isUsernameExists?.dataValues?.id) {
      return {
        status: 409,
        message: 'Персонаж с таким именем уже существует',
        error: 'Персонаж с таким именем уже существует',
      }
    }

    const isPasswordValid = await IsValidPassword(body.password, body.username)

    if (!isPasswordValid.ok) {
      return {
        message: isPasswordValid.message,
        status: 401,
      }
    }

    const hashPassword = await bcrypt.hash(body.password, 10)
    const userHash = await createRandomString()
    const slug = await getTransplit(body.username)

    const user = await UserModel.create({
      username: String(body.username),
      password: String(hashPassword),
      userHash,
      slug,
    })

    const friendList = await UsersFriendsModel.create({
      userId: user.dataValues.id,
    })

    UserModel.update(
      { friendsListId: user.dataValues.id },
      { where: { id: user.dataValues.id } }
    )

    const token: Model = await jwt.sign(
      {
        id: user.dataValues.id,
        name: user.dataValues.username,
      },
      secretKey,
      {
        expiresIn: '15d',
      }
    )

    return {
      body: {
        token,
        user: user.dataValues,
        friendList,
      },
      status: 200,
      message: 'Пользователь создан',
    }
  }

  @Post('/login')
  async login(@Body() body: CreateUserInterface) {
    const user = await UserModel.findOne({
      where: { username: String(body.username) },
    })

    if (!user) {
      return {
        message: 'Пользователь с таким именем не найден',
        status: 404,
        ok: false,
      }
    }

    const isPassword = await bcrypt.compare(
      body.password,
      user.dataValues.password
    )

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

    if (!user)
      return {
        status: 304,
        message: 'Трубуется подтвердить авторизацию',
        error: 'User Token is invalid',
      }

    return {
      message: 'Авторизация подтверждена',
      ok: true,
      status: 200,
      body: {
        user,
      },
    }
  }

  @Post('/set-user-hash')
  @UseBefore(AuthMiddleware)
  async setUserInvatedHash(
    @Body() body: SetUserInvitedHashInterface,
    @Req() request
  ) {
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

    const referal = await UserModel.findOne({
      where: { userHash: invitedHash },
    })

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

    await UserModel.update(
      { invitedHash, endVIPDate: dateEnd },
      { where: { id: user.id } }
    )
    await UserModel.update(
      { endVIPDate: referalVIPDateEnd, isVIPStatus: true },
      { where: { id: referal.dataValues.id } }
    )

    return {
      ok: true,
      status: 200,
      message: 'Реферальный код указан',
    }
  }

  @Post('/set-user-role')
  @UseBefore(AuthMiddleware)
  async setRole(@Body() body, @Req() request) {
    const role: UserRoleType = body.role
    const user = request.user

    if (user.role === 'ROOT')
      return {
        status: 304,
        message: 'Никто не может поменять роль ROOT',
        error: 'NotPermission',
      }

    await UserModel.update({ role }, { where: { id: user.id } })

    return {
      status: 200,
      message: 'Роль успешно изменена',
      body: {},
    }
  }

  @Post('/update-user')
  @UseBefore(AuthMiddleware)
  async updateUser(@Req() req, @Body() body: UpdateUserDataInterface) {
    const user = req.user

    const candidat = await UserModel.findOne({ where: { id: user.id } })

    if (!candidat)
      return {
        status: 404,
        message: 'Пользователь с таким именем не найден',
        error: 'NotFound',
      }

    await UserModel.update({ ...body }, { where: { id: user.id } })

    return {
      status: 200,
      message: 'Данные были обновлены',
      ok: true,
      body: {},
    }
  }

  async setOnlinestatus(id, isOnline) {
    await UserModel.update({ isOnline }, { where: { id } })
  }

  @Get('/get-developer-roles')
  async getDeveloperRoles() {
    return {
      status: 200,
      message: 'Список ролей получен',
      body: {
        roles: developerRoleList,
      },
    }
  }

  @Get('/get-developers')
  async getDevelopers () {
    return {
      status: 200,
      message: 'Авторы проекта получены',
      body: {
        developers: developerList,
      },
    }
  }

  @Get('/get-user/:slug')
  async getUser (@Params() params) {
    const slug: string = params.slug

    const user = UserModel.findOne(
      { where: { slug } },
    )

    return {
      status: 200,
      message: 'Пользователь получен',
      body: {
        user,
      }
    }
  }

  @Get('/get-users')
  async getUsers (@QueryParams() query: GetUsersQueryInterface, @Req() req) {
    try {
      const {
        limit = 20,
        page = 1,
      } = query

      const token = getToken(req)
      let isAdmin = false

      if (token) {
        const { user } = await checkToken(token)
        const role = user?.role || 'USER'

        isAdmin = role === 'USER' ? false : true
      }
      const totalOffset = (Number(page) * limit) - limit

      const users = await UserModel.findAll({
        attributes: isAdmin ? UserAttributesForAdmin : UserAttributesForUser,
        limit, offset: totalOffset,
      })
      const count = await UserModel.count()

      const totalPages = Math.ceil(
        count / limit > 1 ? Math.ceil(count) / limit : 1
      )
      const isNextPageAvaible = Number(page) + 1 <= totalPages ? true : false

      const pagination = {
        totalCount: count,
        offset: totalOffset,
        activePage: Number(page),
        totalPages: totalPages,
        isNextPageAvaible,
        isPrevPageAvaible: Boolean(page - 1 > 0),
      }

      return {
        status: 200,
        message: 'Пользователи получены',
        body: {
          users: users.map(el => el.dataValues),
          pagination,
        }
      }
    } catch(e) {
      return {
        status: 501,
        message: '',
        error: e,
      }
    }
  }

  @Get('/get-developer/:slug')
  async getDeveloper (@Params() params) {
    const slug: string = params.slug
    const develoepr = developerList.find(el => el.slug === slug)
    
    if (!develoepr) return {
      status: 404,
      message: 'Пользователь не найден',
      error: 'NotFound'
    }

    return {
      status: 200,
      message: 'Разработчик получен',
      body: {
        develoepr,
      },
    }
  }
}
