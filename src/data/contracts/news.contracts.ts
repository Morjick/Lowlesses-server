export interface NewsItemInterface {
  id: number
  titleRU: string
  titleEN: string
  bodyRU: string
  bodyEN: string
  descriptionRU: string
  descriptionEN: string
  isShow: boolean
  slug: string
  avatar: string
  tags: string[]
  autorId: number
}

export interface CreateNewsItemDataInterface {
  titleRU: string
  titleEN?: string
  bodyRU: string
  bodyEN?: string
  descriptionRU: string
  descriptionEN?: string
  isShow?: boolean
  avatar?: string
  tags: string[]
}

export interface UpdateNewsDataInterface extends CreateNewsItemDataInterface {
  slug: string
  id: number
  autorId: number
}
