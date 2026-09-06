import { Controller, Get } from "@nestjs/common";
import { GamesService } from "./games.service";

@Controller("games")
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get()
  list() {
    return this.games.listActive();
  }
}
