import { CoordsInterface } from "src/data/GameMaps";

export const isObjectInRadius = (position: CoordsInterface, objectPosition: CoordsInterface, radius: number): boolean => {
  const xBorders = [position.x - radius, position.x + radius]
  const yBorders = [position.y - radius, position.y + radius]

  const isObjectInRadiusX = objectPosition.x >= xBorders[0] && objectPosition.x <= xBorders[1]
  const isObjectInRadiusY = objectPosition.y >= yBorders[0] && objectPosition.y <= yBorders[1]

  if (isObjectInRadiusX && isObjectInRadiusY) return true

  return false
}
