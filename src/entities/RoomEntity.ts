
export interface RoomEntityCreateData {
  hash: string
  users: any[]
  gameStart: string
  gameTime: number
}

export class RommEntity {
  hash = null

  constructor (data: RoomEntityCreateData) {
    this.hash = data.hash
  }
}
