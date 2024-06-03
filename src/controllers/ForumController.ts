import { ForumSendCommentDataInterface } from './../data/contracts/forum.contracts';
import { AdminMiddleware } from './../middleware/AdminMiddleware';
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
import { obscense } from '../libs/filters/obscense';
import { ForumCommentModel } from '../models/ForumCommentMode';

@JsonController ('/forum')
export class ForumController {
  @Post('/create-theme')
  @UseBefore(AdminMiddleware)
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
  @UseBefore(AuthMiddleware)
  async createArticle (@Req() request, @Body() body: CreateForumArticleDataInterface) {
    const user = request.user || (await checkToken(request.headers.authorization)).user
    const isUserRole = user.role === 'USER'

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
      isShow: isUserRole ? false : true,
      isModeration: isUserRole ? false : true,
      moderatorId: isUserRole ? null : user.id
    })

    return {
      status: 200,
      message: isUserRole ? 'Статья отправлена на модерацию' : 'Статья опубликована',
      body: {
        article: article.dataValues,
      }
    }
  }

  @Post('/moderate-article/:slug')
  @UseBefore(AdminMiddleware)
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
        [locale === 'ru-RU' ? 'titleRU' : 'titleEN', 'title'],
        [locale === 'ru-RU' ? 'descriptionRU' : 'descriptionEN', 'description'],
        'tags',
        'avatar',
        'id',
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
        'tags',
        'views',
        'createdAt',
        // 'body',
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
            'avatar',
          ]
        }
      ],
    })
    const theme = await ForumThemeModel.findOne({
      where: { id: themeId },
      attributes: [
        [locale === 'ru-RU' ? 'titleRU' : 'titleEN', 'title'],
        [locale === 'ru-RU' ? 'descriptionRU' : 'descriptionEN', 'description'],
        'tags',
        'avatar',
        'id',
      ]
    })

    const articleCount = await ForumArticleModel.count({ where: { isShow: true, locale, themeId }, })

    const pages = Math.ceil(articleCount / limit > 1 ? Math.ceil(articleCount) / limit : 1)
    const activePage = Math.ceil(offset / limit)
      ? Math.ceil(offset / limit) + 1
      : 1
    const nextPageAvaible = activePage + 1 > pages ? false : true

    const getCommentsLength = async (id: number): Promise<number> => {
      const comments = await ForumCommentModel.count({ where: { articleId: id, isModerated: true, } })

      return comments
    }

    const articlesValue = await Promise.all(articles.map(async (el) => {
      const commentsCount = await getCommentsLength(el.dataValues.id)

      return {
        ...el.dataValues,
        autor: el.dataValues.autor.dataValues,
        commentsCount: commentsCount,
      }
    }))

    return {
      status: 200,
      message: 'Статьи успешно получены',
      body: {
        articles: articlesValue,
        pagination: {
          totalCount: articleCount,
          isNextPageAvaible: nextPageAvaible,
          isPrevPageAvaible: Boolean(activePage - 1 > 0),
          activePage,
          totalPages: pages,
        },
        theme: theme.dataValues
      }
    }
  }

  @Get('/get-articles/:slug')
  async getArticle (@Params() params) {
    const { slug } = params

    const article = await ForumArticleModel.findOne(
      { where: { slug, isShow: true },
    })

    if (!article || !article.dataValues.isShow) return {
      status: 404,
      message: 'Статья не была найдена',
      error: 'Page Not Found'
    }

    const comments = await ForumCommentModel.findAll({
      where: {
        articleId: article.dataValues.id,
        isModerated: true,
      },
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
            'avatar',
          ],

        }
      ]
    })

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
          comments: comments.map(el => {
            return {
              ...el.dataValues,
              autor: el.dataValues.autor.dataValues
            }
          })
        }
      }
    }
  }

  @Get('/get-articles-moderation')
  @UseBefore(AdminMiddleware)
  async getArticlesForModeration () {
    const articles = await ForumArticleModel.findAll({ where: { isShow: false } })

    return {
      message: 'Статьи для модерации получены',
      status: 200,
      body: {
        articles: articles.map(el => el.dataValues)
      }
    }
  }

  @Delete('/delete-article/:slug')
  @UseBefore(AdminMiddleware)
  async deleteArticle (@QueryParams() query) {
    const { slug } = query

    await ForumArticleModel.destroy({ where: { slug } })

    return {
      status: 200,
      message: 'Статья была удалена',
    }
  }

  @Post('/send-comment')
  @UseBefore(AuthMiddleware)
  async sendComment(@Body() body: ForumSendCommentDataInterface, @Req() req) {
    if (!body.message || (body.message.length < 10 || body.message.length > 50)) return {
      status: 400,
      message: 'Поле "message" является обязательным и должно быть не менее 10 и не более символов',
      error: 'InvalidField'
    }

    if (!body.articleId || typeof body.articleId !== 'number') return {
      status: 400,
      message: 'Поле "articleId" обязательно и должно быть числом',
      error: 'InvalidField'
    }

    const user = req.user
    const isValidMessage = obscense(body.message)

    const article = await ForumArticleModel.findOne({ where: { id: body.articleId } })

    if (!article) return {
      status: 404,
      message: 'Статья с таким ID не была найдена',
      error: 'NotFound'
    }
    
    const comment = await ForumCommentModel.create({
      message: body.message,
      autorId: user.id,
      isModerated: isValidMessage,
      publicDate: new Date().toLocaleString('ru'),
      articleId: body.articleId,
    })

    return {
      status: 200,
      message: isValidMessage ? 'Комментарий оставлен' : 'Комментарий отправлен на модерацию',
      body: {
        comment: comment.dataValues,
      },
    }
  }

  @Post('/moderate-comment/:id')
  @UseBefore(AdminMiddleware)
  async moderateComment(@Param('id') id: number, @Req() req) {
    const user = req.user
    
    const comment = await ForumCommentModel.findOne({ where: { id: Number(id) } })

    if (!comment || comment.dataValues.isModerated) return {
      status: 404,
      message: 'Комментарий не был найден',
      error: 'NotFound',
    }

    await ForumCommentModel.update({ moderatorId: user.id, isModerated: true }, { where: { id } })

    return {
      status: 200,
      message: 'Комментарий был допущен к публикации',
      body: {},
    }
  }

  @Delete('/delete-comment/:id')
  @UseBefore(AuthMiddleware)
  async deleteComment (@Param('id') id: number, @Req() req) {
    const user = req.user
    const comment = await ForumCommentModel.findOne({ where: { id: Number(id) } })

    if (!comment) return {
      status: 404,
      message: 'Комментарий не был найден',
      error: 'NotFound'
    }

    if (user.role === 'USER' && comment.dataValues.autorId !== user.id) return {
      message: 'Вы не можете удалить чужой комментарий',
      status: 304,
      error: 'NotPermissions'
    }

    const response = await ForumCommentModel.destroy({ where: { id } })

    return {
      status: 200,
      message: 'Комментарий был удалён',
      body: {
        response,
      }
    }
  }

  @Get('/get-comments-on-moderate')
  @UseBefore(AdminMiddleware)
  async getCommentsOnModerate () {
    const comments = await ForumCommentModel.findAll({ where: { isModerated: false }, include: { all: true } })

    return {
      status: 200,
      message: 'Комментарии для модерации получены',
      body: {
        comments: comments.map(el => el.dataValues),
      }
    }
  }

  @Get('/get-count-moderate-comments')
  @UseBefore(AdminMiddleware)
  async getModerateCommentsCount () {
    const comments = await ForumCommentModel.count({ where: { isModerated: false }})

    return {
      status: 200,
      message: 'Число комментариев на модерации получено',
      body: {
        comments: comments,
      }
    }
  }
}
