import { LocaleListType } from './global.contracts'

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

export type EstimateActionsType = 'like' | 'dislike' | null

export interface ForumEstimateCommentDataInterface {
  id: number
  action: EstimateActionsType
}

export  type ForumComplaintCommentType = 'insult' | 'legal' | 'content'

export interface ForumComplaintCommentInterface {
  type: ForumComplaintCommentType
  title: string
  message: string
  comment?: any
}

export type ModerateComplaintACtionType = 'ban' | 'aproove'

export interface ModerateComplaintCommentInterface {
  action: ModerateComplaintACtionType
}
