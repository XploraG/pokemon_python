class Game_Save:
    """
    This is the main save class.
    It contains all the propeties that a save can have.

    Attributes:
        name (str): The name of the save.
        time (int): The time that the player has been playing.
        player_coordinates (tuple[int, int]): The coordinates of the player.
        map (str): The map that the player is on.
        economy_data (dict): Economy system data (coins, medals, streaks, etc.).
        inventory_data (dict): Player inventory data.
        team_data (list): Player's pokemon team data.

    :param name: The name of the save.
    :param time: The time that the player has been playing.
    :param player_coordinates: The coordinates of the player.
    :param map: The map that the player is on.
    :param economy_data: Economy system data.
    :param inventory_data: Player inventory data.
    :param team_data: Player's pokemon team data.
    """
    player_coordinates: tuple[int, int]
    name: str
    map: str
    # The time in seconds
    time: int
    actual_play: str
    economy_data: dict
    inventory_data: dict
    team_data: list

    def __init__(self, name: str, time: int,
                 player_coordinates: tuple[int, int],
                 map: str, actual_play: str,
                 economy_data: dict = None,
                 inventory_data: dict = None,
                 team_data: list = None):
        self.player_coordinates = player_coordinates
        self.map = map
        self.name = name
        self.time = time
        self.actual_play = actual_play
        self.economy_data = economy_data if economy_data is not None else {}
        self.inventory_data = inventory_data if inventory_data is not None else {}
        self.team_data = team_data if team_data is not None else []
