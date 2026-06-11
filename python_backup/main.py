import asyncio
import pygame
from pygame.constants import DOUBLEBUF, FULLSCREEN
from src.lib import config
from src.Game import Game_Context
from src.lib.Game_State import Game_State


class Main:
    game: Game_Context
    flags = FULLSCREEN | DOUBLEBUF
    screen = pygame.display.set_mode((0, 0))
    clock: pygame.time.Clock

    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode(config.Resolution)
        if config.DEV_MODE:
            self.screen = pygame.display.set_mode((640*2, 480*2))
        self.clock = pygame.time.Clock()
        self.set_up()

    def set_up(self):
        pygame.display.set_caption("Pixel Tamer")
        self.game: Game_Context = Game_Context(self.screen)
        self.game.set_up()

    async def execute(self):
        while self.game.game_state == Game_State.RUNNING:
            self.clock.tick(config.FPS)
            self.game.update()
            pygame.display.flip()
            await asyncio.sleep(0)  # Yields control back to the browser loop


async def main():
    main_obj: Main = Main()
    await main_obj.execute()


if __name__ == '__main__':
    asyncio.run(main())
