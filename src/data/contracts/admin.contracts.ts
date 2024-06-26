import { OpenUserDataInterface } from "../../models/UserSchema"

export type AppealThemeType = 'error' | 'problems' | 'account'

export interface CreateAppealInterface {
  message: string
  title: string
  theme: AppealThemeType
}

export interface AppealInterface {
  user: OpenUserDataInterface
  message: string
  title: string
  theme: AppealThemeType
  time: string
}
