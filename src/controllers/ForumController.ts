import { Body, Post, Get, JsonController, UseBefore, Req, QueryParams, Param, Params, Delete } from 'routing-controllers'
import { AuthMiddleware } from '../middleware/AuthMiddleware'
import { CreateNewsItemDataInterface } from '../data/contracts/news.contracts'
import getTransplit from '../libs/getTranslate'
import { LocaleListType } from '../data/contracts/global.contracts'
import { UserModel } from '../models/UserModel'
import { CreateForumArticleDataInterface, CreateForumThemeDataInterface, ForumModerateArticleDataInterface } from '../data/contracts/forum.contracts'
import { ForumThemeModel } from '../models/ForumThemeModel'
import { ForumArticleModel } from '../models/ForumArticleModel'
import { checkToken } from '../libs/checkAuth'

@JsonController ('/forum')
export class ForumController {
  @Post('/create-theme')
  @UseBefore(AuthMiddleware)
  async createTheme (@Req() request, @Body() body: CreateForumThemeDataInterface) {
    const user = request.user
    
    if (!body.titleRU || !body.titleEN) {
      return {
        status: 501,
        message: 'Ошибка: для создания темы обязательно указать заголовки',
        error: `Validation Error: field ${body.titleRU ? body.titleEN : body.titleRU} is required`
      }
    }

    const theme = await ForumThemeModel.create({
      ...body,
      autorId: user.id,
    })

    return {
      status: 200,
      message: 'Тема успешно создана',
      body: {
        theme: theme.dataValues,
      }
    }
  }

  @Post('/create-article')
  async createArticle (@Req() request, @Body() body: CreateForumArticleDataInterface) {
    const user = request.user || (await checkToken(request.headers.authorization)).user

    if (!body.locale) return {
      status: 501,
      message: 'Укажите язык, на котором публикуется статья',
      error: 'Validation Error'
    }

    if (!body.title || body.title.length < 5) return {
      status: 501,
      message: 'Поле "Заголовок" является обязательным и должно быть не менее 6 символов длинной',
      error: 'Validation Error'
    }

    if (!body.themeId) return {
      status: 501,
      message: 'Укажите тему, к которой относится статья',
      error: 'Validation Error'
    }

    const slug = getTransplit(body.title)

    const article = await ForumArticleModel.create({
      ...body,
      autorId: user.id,
      themeId: body.themeId,
      slug,
    })

    return {
      status: 200,
      message: 'Статья успешно создана',
      body: {
        article: article.dataValues,
      }
    }
  }

  @Post('/moderate-article/:slug')
  @UseBefore(AuthMiddleware)
  async moderateArticle (@Req() request, @Body() body: ForumModerateArticleDataInterface, @Params() params) {
    const user = request.user
    const { slug } = params

    await ForumArticleModel.update({
      moderatorId: user.id,
      isShow: body.isShow,
      isModeration: body.isModeration,
    }, { where: { slug } })

    return {
      status: 200,
      message: body.isShow ? 'Статья опубликована' : 'Статья заблокирована'
    }
  }

  @Get('/get-themes')
  async getThemes (@QueryParams() query) {
    const locale: LocaleListType = query.locale || 'ru-RU'

    const themes = await ForumThemeModel.findAll({
      attributes: [
        [locale === 'ru-RU' ? 'titleRU' : 'titleEN', 'tite'],
        [locale === 'ru-RU' ? 'descriptionRU' : 'descriptionEN', 'description'],
        'tags',
        'avatar',
      ]
    })

    return {
      status: 200,
      message: 'Темы получены',
      body: {
        themes: themes.map(el => el.dataValues),
      }
    }
  }

  @Get('/get-articles')
  async getArticles (@QueryParams() query) {
    const {
      limit = 20,
      offset = 0,
      themeId = 1,
    } = query

    const locale: LocaleListType = query.locale || 'ru-RU'

    const articles = await ForumArticleModel.findAll({
      where: { isShow: true, locale, themeId },
      offset,
      limit,
      attributes: [
        'id',
        'autorId',
        'slug',
        'tags',
        'title',
        'description',
        'tags'
      ],
      order: [['createdAt', 'DESC']],
    })

    const articleCount = await ForumArticleModel.count({ where: { isShow: true, locale, themeId }, })

    const pages = articleCount / limit > 1 ? Math.ceil(articleCount) / limit : 1
    const nextPageAvaible = pages > 1 ? true : false;
    const activePage = Math.ceil(offset / limit)
      ? Math.ceil(offset / limit)
      : 1

    return {
      status: 200,
      message: 'Статьи успешно получены',
      body: {
        articles: articles.map(el => el.dataValues),
        pagination: {
          totalCount: pages,
          isNextPageAvaible: nextPageAvaible,
          activePage,
        }
      }
    }
  }

  @Get('/get-articles/:slug')
  async getArticle (@Params() params) {
    const { slug } = params

    const article = await ForumArticleModel.findOne({ where: { slug } })

    if (!article || !article.dataValues.isShow) return {
      status: 404,
      message: 'Статья не была найдена',
      error: 'Page Not Found'
    }

    const autor = await UserModel.findOne({
      where: { id: article.dataValues.autorId },
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
      message: 'Статья получена',
      body: {
        article: {
          ...article.dataValues,
          autor: autor.dataValues,
        }
      }
    }
  }

  @Delete('/delete/:slug')
  @UseBefore(AuthMiddleware)
  async deleteArticle (@QueryParams() query) {
    const { slug } = query

    await ForumArticleModel.destroy({ where: { slug } })

    return {
      status: 200,
      message: 'Статья была удалена',
    }
  }
}
