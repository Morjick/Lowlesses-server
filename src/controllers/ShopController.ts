import { Body, Delete, Get, HeaderParam, JsonController, Param, Post, UseBefore } from "routing-controllers";
import { checkToken } from "../libs/checkAuth";
import { CreateEquipmentItemInterface, EquipmentModel } from "../models/EquipmentModel";
import { AdminMiddleware } from "../middleware/AdminMiddleware";
import { BaffsModel, CreateBaffInterface } from "../models/BaffsModel";

@JsonController('/shop')
export class ShopController {

  @Post('/create-equipment')
  @UseBefore(AdminMiddleware)
  async createItem(@Body() body: CreateEquipmentItemInterface, @HeaderParam("Authorization", { type: "string" }) token) {
    try {
      const item = await EquipmentModel.create({
        title: body.title,
        price: body.price,
        discount: body.discount ? body.discount : 0,
        equipmentType: body.type
      })

      body.baffs.forEach(async (baff) => {
        await BaffsModel.create({
          field: baff.field,
          value: baff.value,
          action: baff.action,
          equipmentId: item.dataValues.id
        })
      })

      return {
        status: 200,
        message: 'OK',
        body: {
          item: item.dataValues
        }
      }
    } catch(e) {
      console.log(e)
    }
  }

  @Post('/create-baff')
  @UseBefore(AdminMiddleware)
  async createBaff (@Body() body: CreateBaffInterface) {
    const { field, value, action } = body

    if (!field || !value || !action) return {
      status: 403,
      message: 'Для создания бафа необходимо указать все параметры',
      error: 'Для создания бафа необходимо указать все параметры',
    }

    const baff = await BaffsModel.create({
      field, value, action
    })

    return {
      status: 200,
      message: 'Баф успешно добавлен в игру',
      body: {
        id: baff.dataValues.id,
        baff: baff.dataValues
      }
    }
  }

  @Get('/get-shop', { transformResponse: false })
  async getShop () {
    try {
      const shop = await EquipmentModel.findAll({ include: { all: true, nested: true } })

      return {
        status: 200,
        message: 'Магазин успешно получен',
        body: {
          shop
        }
      }
    } catch(e) {
      return {
        status: 501,
        error: e,
        message: 'Произошла ошибка при попытке получить товары'
      }
    }
  }

  @Delete('/delete-item/:id')
  @UseBefore(AdminMiddleware)
  async deleteItem(@Param('id') id: number) {
    await EquipmentModel.destroy({ where: { id } })

    return {
      status: 200,
      message: 'Предмет был удалён'
    }
  }
}
