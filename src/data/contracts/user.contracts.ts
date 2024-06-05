import { UserRoleType } from './../../models/UserModel'
import { CreateUserInterface } from '../../models/UserSchema'

export interface UpdateUserFromAdminInterface extends CreateUserInterface {
  id: number
  avatar?: string
  social?: UserSocialHrefsInterface
}

export interface UserSocialHrefsInterface {
  telegram: string
  vk: string
  whatsapp: string
  discord: string
}

export type AdminDeveloperRoleType = 'Художник' | 'Программист'

export interface AddAdminDataInterface {
  role: UserRoleType
  developerRole: AdminDeveloperRoleType
  username: string
  firstname: string
  lastname: string
  patronomic: string
  password: string
  email: string
  avatar: string
  description: string
}
