import { checkToken } from '../libs/checkAuth'

export const AdminMiddleware = async (
  request: any,
  response: any,
  next?: (err?: any) => any
) => {
  try {
    const token = request.headers.authorization

    const { user, ok } = await checkToken(token)

    if (user.role === 'USER' || !ok) {
      throw new Error()
    }

    request.user = user
    next()
  } catch {
    const error = response.status(403).json({
      ok: false,
      status: 403,
      message: 'Для этого метода у вас недостаточно прав',
      error: 'Для этого метода у вас недостаточно прав',
    })
    next(error)
  }
}
