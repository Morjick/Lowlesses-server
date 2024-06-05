import { OpenUserDataInterface, UserModel } from '../models/UserSchema'

export interface CreateUserEntityInterface {
  id: number
  details: OpenUserDataInterface
}

export class UserEntity {
  id = null
  details: OpenUserDataInterface = null

  constructor(data: CreateUserEntityInterface) {
    this.id = data.id
    this.details = data.details
  }

  async disconnect() {
    await UserModel.update(
      {
        isOnline: false,
        userLockedData: JSON.stringify(this.details.userLockedData),
      },
      { where: { id: this.id } }
    )
  }
}
