import * as bcrypt from 'bcrypt'
import { UserModel } from '../../models/UserModel'
import { UsersFriendsModel } from '../../models/UserFriendsModel'
import { createRandomString } from '../../libs/createRandomString'

require('dotenv').config()

export const CreateRootUser = async () => {
  const hashPassword = await bcrypt.hash(process.env.ROOT_PASSWORD, 10)

  const isUserExists = await UserModel.findOne({ where: { role: 'ROOT' } })

  if (isUserExists?.dataValues) return

  const hash = await createRandomString()

  const user = await UserModel.create({
    username: process.env.ROOT_NAME,
    password: String(hashPassword),
    role: 'ROOT',
    userHash: hash,
    email: 'lowlesses@mail.ru',
    firstname: 'Lowlesses',
    lastname: 'Team'
  })

  await UsersFriendsModel.create({ userId: user.dataValues.id })
}
