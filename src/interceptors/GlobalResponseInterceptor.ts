import { response } from 'express';
import { Interceptor, InterceptorInterface, Action, HttpCode } from 'routing-controllers';

interface ContentInterface {
  status: number
  body: any
  message?: string
  error?: string
}

@Interceptor()
export class GlobalResponseInterceptor implements InterceptorInterface {
  intercept(action: Action, content: ContentInterface) {
    if (!content?.status) {
      return {
        status: 501,
        message: 'Неожиданная ошибка сервера, попробуйте позже'
      }
    }

      const customResponse = {
        status: content.status || 501,
        message: content.message,
        body: content.body,
        error: content.error?.length ? 
          content.error : 
          content.status >= 300 ? 
            'Неожиданная ошибка сервера, попробуйте позже' : 
            null 
      }

      return customResponse
  }
}
