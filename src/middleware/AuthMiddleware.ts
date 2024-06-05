import { checkToken } from '../libs/checkAuth'

export const AuthMiddleware = async (
  request: any,
  response: any,
  next?: (err?: any) => any
) => {
  try {
    const token = request.headers.authorization

    const { user, ok } = await checkToken(token)

    if (!user || !ok) {
      throw new Error()
    }

    if (!user?.role) throw new Error()

    request.user = user
    next()
  } catch (e) {
    const error = response.status(401).json({
      ok: false,
      status: 401,
      message: 'Для этого запроса необходимо авторизоваться',
      error: 'Для этого запроса необходимо авторизоваться',
    })
    next(error)
  }
}
