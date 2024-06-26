import { EveryDayQuestInterface, EveryDayQuestList } from '../data/lists/everyday-qiests.list'
import { createRandomNumber } from './createRandomNumber'

export const getEveryDayQuests = (): EveryDayQuestInterface[] => {
  const quests = new Array<EveryDayQuestInterface>()

  for (let i = 0; i < 3; i++) {
    const index = createRandomNumber(0, 3)

    quests.push(EveryDayQuestList[index])
  }

  return quests
}
