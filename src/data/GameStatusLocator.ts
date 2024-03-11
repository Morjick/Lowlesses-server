export interface GameStatusLocatorInterface {

}

export class GameStatusLocator {
  onlinePlayers = 0;
  
  connectPlayer () {
    this.onlinePlayers = this.onlinePlayers + 1
  }

  disconnectPlayer () {
    this.onlinePlayers = this.onlinePlayers - 1
  }
}
