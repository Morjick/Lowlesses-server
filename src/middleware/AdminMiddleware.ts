import { checkToken } from "../libs/checkAuth"

export const AdminMiddleware = async (request: any, response: any, next?: (err?: any) => any) => {
  const token = request.headers.authorization

  const { user } = await checkToken(token)

  if (user.role === 'USER') return {
    ok: false,
    status: 403,
    message: "Для этого метода у вас недостаточно прав",
    error: "Для этого метода у вас недостаточно прав",
  }

  next()
}
