import {
  Body,
  Post,
  Get,
  JsonController,
  UseBefore,
  Req,
  QueryParams,
  Param,
  Params,
  Delete,
} from 'routing-controllers'
import { AuthMiddleware } from '../middleware/AuthMiddleware'
import {
  CreateNewsItemDataInterface,
  UpdateNewsDataInterface,
} from '../data/contracts/news.contracts'
import getTransplit from '../libs/getTranslate'
import { NewsModel } from '../models/NewsModel'
import { LocaleListType } from '../data/contracts/global.contracts'
import { UserModel } from '../models/UserModel'
import { AdminMiddleware } from '../middleware/AdminMiddleware'

@JsonController('/news')
export class NewsController {
  @Post('/create')
  @UseBefore(AdminMiddleware)
  async createNews(@Body() body: CreateNewsItemDataInterface, @Req() request) {
    const autor = request.user

    if (!body.titleRU?.length || body.titleRU?.length < 5) {
      return {
        status: 501,
        message: 'Длинна заголовка должна быть не менее 5 символов',
        error:
          'Invalid params error: length of the title must be more than 5 characters',
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
        news: news.dataValues,
      },
    }
  }

  @Post('/update-news/:slug')
  @UseBefore(AuthMiddleware)
  async updateNews(@Body() body: UpdateNewsDataInterface, @Params() params) {
    const slug: string = params.slug

    const candidate = await NewsModel.findOne({ where: { slug } })

    if (!candidate)
      return {
        status: 404,
        message: 'Новость с таким SLUG не найдена',
        error: 'NotFound',
      }

    const updated = await NewsModel.update({ ...body }, { where: { slug } })

    return {
      status: 200,
      message: 'Новость успешно отредактирована',
      body: {
        updated,
      },
    }
  }

  @Get('/get-news/:slug')
  async getNewsItem(@QueryParams() query, @Params() params) {
    const locale: LocaleListType = query.locale || 'ru-RU'
    const slug: string = params.slug

    const news = await NewsModel.findOne({
      where: { slug, isShow: true },
      attributes: [
        'id',
        [locale === 'ru-RU' ? 'titleRU' : 'titleEN', 'title'],
        [locale === 'ru-RU' ? 'bodyRU' : 'bodyEN', 'body'],
        [locale === 'ru-RU' ? 'descriptionRU' : 'descriptionEN', 'description'],
        'autorId',
        // 'autor',
        'publicData',
        'slug',
        'avatar',
        'tags',
        'createdAt',
      ],
      include: [
        {
          model: UserModel,
          as: 'autor',
          attributes: [
            'username',
            'id',
            'isOnline',
            'role',
            'firstname',
            'lastname',
            'patronomic',
            'email',
            'slug',
            'developerRoleRU',
          ],
        },
      ],
    })

    if (!news)
      return {
        status: 404,
        message: 'Новость не найдена',
        error: 'NotFound',
      }

    return {
      status: 200,
      message: 'Новость успешно получена',
      body: {
        news: {
          ...news.dataValues,
          // autor: autor.dataValues,
        },
        locale,
      },
    }
  }

  @Get('/get-news-edit/:slug')
  @UseBefore(AuthMiddleware)
  async getNewsForEdit(@Params() params) {
    const slug: string = params.slug

    const news = await NewsModel.findOne({
      where: { slug, isShow: true },
      attributes: [
        'id',
        'titleRU',
        'titleEN',
        'bodyRU',
        'bodyEN',
        'descriptionRU',
        'descriptionEN',
        'autorId',
        'publicData',
        'slug',
        'avatar',
        'tags',
        'createdAt',
        'isShow',
      ],
      include: [
        {
          model: UserModel,
          as: 'autor',
          attributes: [
            'username',
            'id',
            'isOnline',
            'role',
            'firstname',
            'lastname',
            'patronomic',
            'email',
            'slug',
            'developerRoleRU',
          ],
        },
      ],
    })

    if (!news)
      return {
        status: 404,
        message: 'Новость не найдена',
        error: 'NotFound',
      }

    return {
      status: 200,
      message: 'Новость успешно получена',
      body: {
        news: {
          ...news.dataValues,
          // autor: autor.dataValues,
        },
      },
    }
  }

  @Get('/get-many')
  async getManyNews(@QueryParams() query) {
    const { limit = 5, offset = 0 } = query

    const locale: LocaleListType = query.locale || 'ru-RU'

    const news = await NewsModel.findAll({
      where: { isShow: true },
      attributes: [
        [locale === 'ru-RU' ? 'titleRU' : 'titleEN', 'title'],
        [locale === 'ru-RU' ? 'bodyRU' : 'bodyEN', 'body'],
        [locale === 'ru-RU' ? 'descriptionRU' : 'descriptionEN', 'description'],
        'id',
        'autorId',
        'publicData',
        'slug',
        'avatar',
        'tags',
      ],
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: UserModel,
          as: 'autor',
          attributes: [
            'username',
            'id',
            'isOnline',
            'role',
            'firstname',
            'lastname',
            'patronomic',
            'email',
          ],
        },
      ],
      limit,
      offset,
    })

    const newsCount = await NewsModel.count({ where: { isShow: true } })

    const pages = Math.ceil(
      newsCount / limit > 1 ? Math.ceil(newsCount) / limit : 1
    )
    const activePage = Math.ceil(offset / limit)
      ? Math.ceil(offset / limit) + 1
      : 1
    const nextPageAvaible = activePage + 1 > pages ? false : true

    return {
      status: 200,
      message: 'Список новостей получен',
      body: {
        news: news.map((el) => {
          return {
            ...el.dataValues,
            autor: el.dataValues?.autor?.dataValues,
          }
        }),
        pagination: {
          totalCount: newsCount,
          isNextPageAvaible: nextPageAvaible,
          isPrevPageAvaible: Boolean(activePage - 1 > 0),
          activePage,
          totalPages: pages,
        },
      },
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
        news: news.map((el) => el.dataValues),
      },
    }
  }

  @Delete('/:slug')
  @UseBefore(AuthMiddleware)
  async deleteNews(@Param('slug') slug: string) {
    const newsID = await NewsModel.destroy({ where: { slug } })

    return {
      message: 'Новость была удалена',
      status: 200,
      body: {
        deletedNewsID: newsID,
      },
    }
  }
}
