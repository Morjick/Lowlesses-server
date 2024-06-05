import { UserModel } from '../models/UserModel'

export const createRandomString = async (length: number = 20) => {
  let result = ''
  let stringLengthCounter = 0
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  while (stringLengthCounter < length) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
    stringLengthCounter++
  }

  const isUserHashExist = await UserModel.findOne({
    where: { userHash: result },
  })

  if (isUserHashExist) {
    const newResult = await createRandomString()

    return newResult
  }

  return result
}
