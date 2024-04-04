export const createRandomNumber = (min, max) => {
  return Math.floor(min + Math.random() * (max - min + 1))
}
