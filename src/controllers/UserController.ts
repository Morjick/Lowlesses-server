import { CreateUserInterface, UserModel } from '../models/UserSchema'
import { Controller, Param, Body, Get, Post, Put, Delete, JsonController } from 'routing-controllers'
import bcrypt from 'bcrypt'
import 'reflect-metadata'
import { IsValidPassword } from '../libs/isValidVassword'
import jwt from 'jsonwebtoken'
import { Model } from 'sequelize'
import { config } from 'dotenv'
import { secretKey } from '../data/DataBase'



@JsonController ('/user')
export class UserController {
  @Get('/get-all')
  getAll() {
    return {
      status: 200,
      message: 'пользователи найдены',
      body: {
        users: []
      }
    }
  }

  @Post('/create-user')
  async createUser(@Body() body: CreateUserInterface) {
    if (!body.username?.length || !body.password?.length) {
      return {
        status: 304,
        message: 'Пожалуйста, заполните все поля',
        error: 'Пожалуйста, заполните все поля'
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

    const user = await UserModel.create({
      username: body.username,
      password: String(hashPassword)
    })


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
      token,
      user: user.dataValues,
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
}
