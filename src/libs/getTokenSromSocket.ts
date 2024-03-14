export const getTokenSromSocket = (socket: any): string | null => {
  if (!socket?.request?.headers) {
    return null
  }

  return socket.request.headers['auth-token']
}
