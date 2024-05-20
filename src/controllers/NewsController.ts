import { Body, Post, Get, JsonController, UseBefore, Req, QueryParams, Param, Params, Delete } from 'routing-controllers'
import { AuthMiddleware } from '../middleware/AuthMiddleware'
import { CreateNewsItemDataInterface } from '../data/contracts/news.contracts'
import getTransplit from '../libs/getTranslate'
import { NewsModel } from '../models/NewsModel'
import { LocaleListType } from '../data/contracts/global.contracts'
import { UserModel } from '../models/UserModel'

@JsonController ('/news')
export class NewsController {

  @Post('/create')
  @UseBefore(AuthMiddleware)
  async createNews(@Body() body: CreateNewsItemDataInterface, @Req() request) {
    const autor = request.user

    if (!body.titleRU.length || body.titleRU.length < 5) {
      return {
        status: 501,
        message: 'Длинна заголовка должна быть не менее 5 символов',
        error: 'Invalid params error: length of the title must be more than 5 characters'
      }
    }

    const slug = getTransplit(body.titleRU)

    const news = await NewsModel.create({
      ...body,
      autorId: autor.id,
      slug,
      publicData: new Date().toLocaleString('ru'),
    })

    return {
      status: 200,
      message: 'Новость успешно создана',
      body: {
        news
      }
    }
  }

  @Get('/get-news/:slug')
  async getNewsItem (@QueryParams() query, @Params() params) {
    const locale: LocaleListType = query.locale || 'ru-RU'
    const slug: string = params.slug

    const news = await NewsModel.findOne(
      { 
        where: { slug },
        attributes: [
          'id',
          [locale === 'ru-RU' ? 'titleRU' : 'titleEN', 'tite'],
          [locale === 'ru-RU' ? 'bodyRU' : 'bodyEN', 'body'],
          [locale === 'ru-RU' ? 'descriptionRU' : 'descriptionEN', 'description'],
          'autorId',
          'publicData',
          'slug',
          'avatar',
          'tags'
        ],
      },
    )

    const autor = await UserModel.findOne({
      where: { id: news.dataValues.autorId },
      attributes: [
        'username',
        'id',
        'isOnline',
        'role',
        'firstname',
        'lastname',
        'patronomic',
        'email',
      ]
    })

    return {
      status: 200,
      message: 'Новость успешно получена',
      body: {
        news: {
          ...news.dataValues,
          autor: autor.dataValues,
        },
        locale
      }
    }
  }

  @Get('/get-many')
  async getManyNews (@QueryParams() query,) {
    const {
      limit = 5,
      offset = 0,
    } = query

    const locale: LocaleListType = query.locale || 'ru-RU'

    const news = await NewsModel.findAll({
      where: { isShow: true },
      attributes: [
        [locale === 'ru-RU' ? 'titleRU' : 'titleEN', 'tite'],
        [locale === 'ru-RU' ? 'bodyRU' : 'bodyEN', 'body'],
        [locale === 'ru-RU' ? 'descriptionRU' : 'descriptionEN', 'description'],
        'id',
        'autorId',
        'publicData',
        'slug',
        'avatar',
        'tags'
      ],
      order: [['createdAt', 'DESC']],
    })

    const newsCount = await NewsModel.count({ where: { isShow: true }, })

    const pages = newsCount / limit > 1 ? Math.ceil(newsCount) / limit : 1
    const nextPageAvaible = pages > 1 ? true : false;
    const activePage = Math.ceil(offset / limit)
      ? Math.ceil(offset / limit)
      : 1

    return {
      status: 200,
      message: 'Список новостей получен',
      body: {
        news: news.map(el => el.dataValues),
        pagination: {
          totalCount: pages,
          isNextPageAvaible: nextPageAvaible,
          activePage,
        }
      }
    }
  }

  @Get('/get-hidden')
  @UseBefore(AuthMiddleware)
  async getHiddenNews() {
    const news = await NewsModel.findAll({ where: { isShow: false } })

    return {
      status: 200,
      message: 'Скрытые новости получены',
      body: {
        news: news.map(el => el.dataValues),
      },
    }
  }

  @Delete('/:slug')
  @UseBefore(AuthMiddleware)
  async deleteNews (@Param('slug') slug: string) {
    const newsID = await NewsModel.destroy({ where: { slug } })

    return {
      message: 'Новость была удалена',
      status: 200,
      body: {
        deletedNewsID: newsID
      }
    }
  }
}
