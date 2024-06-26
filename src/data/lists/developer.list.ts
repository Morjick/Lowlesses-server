import { UserSocialHrefsInterface } from "../contracts/user.contracts"

export interface DeveloperUserInterface {
  firstname: string
  lastname: string
  developerRole: string
  slug: string
  avatar: string
  social: UserSocialHrefsInterface
}

export const developerList: DeveloperUserInterface[] = [
  {
    firstname: 'Храмова',
    lastname: 'Ольга',
    developerRole: 'Художник',
    slug: 'olga-khramova',
    avatar: 'file-1717561981732-609696042.jpg',
    social: {},
  }
]
