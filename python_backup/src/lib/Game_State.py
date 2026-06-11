from enum import Enum


class Game_State(Enum):
    """
    Enum for the different states of the game.
    """
    RUNNING = 1
    ENDED = 2
    PAUSED = 3
    SHOP = 4
    BATTLE = 5
    INVENTORY = 6
    DAILY = 7
