import { checkToken } from "../libs/checkAuth"

export const AuthMiddleware = async (request: any, response: any, next?: (err?: any) => any) => {
  const token = request.headers.authorization

  const { user } = await checkToken(token)

  if (!user?.role) return {
    ok: false,
    status: 401,
    message: "Для выполнения необходимо авторизоваться",
    error: "Для выполнения необходимо авторизоваться",
  }

  request.user = user
  next()
}