export const getToken = (request): string | null => {
  return request.headers.authorization || null
}
