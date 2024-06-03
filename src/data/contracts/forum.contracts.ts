import { LocaleListType } from "./global.contracts"

export interface CreateForumThemeDataInterface {
  titleRU: string
  titleEN: string
  descriptionRU: string
  descriptionEN: string
  tags: string[]
  avatar: string
}

export interface CreateForumArticleDataInterface {
  title: string
  description: string
  body: string
  locale: LocaleListType
  themeId: number
}

export interface ForumModerateArticleDataInterface {
  isModeration: boolean
  isShow: boolean
}

export interface ForumSendCommentDataInterface {
  message: string
  articleId: number
}
