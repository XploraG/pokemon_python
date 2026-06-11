from typing import Union
from src.lib import config
from src.lib.Game_Sound import Game_Sound
from src.lib.Economy import Economy
from src.lib.Inventory import Inventory
from src.scenes.main.entities.Entity import Entity
from src.scenes.main.utils.Player_Loader import Player_Loader


class Player(Entity):
    """
    """

    def __init__(self, economy_data: dict = None, inventory_data: dict = None,
                 team_data: list = None):
        path = config.PLAYER_PATH
        self.entity_loader = self.get_Entity_Loader(path)
        super().__init__(path, self.entity_loader.coordinates[0],
                         self.entity_loader.coordinates[1])
        
        # Load from active save file if no data was explicitly passed
        if economy_data is None and inventory_data is None and team_data is None:
            import json
            from src.utils.save_utils import read_save
            try:
                with open(path, 'r', encoding='utf-8') as file:
                    player_data = json.load(file)
                actual_save = player_data.get('actual_save')
                if actual_save:
                    game_save = read_save(actual_save)
                    economy_data = game_save.economy_data
                    inventory_data = game_save.inventory_data
                    team_data = game_save.team_data
            except Exception as e:
                print(f"Error auto-loading save data: {e}")

        # Economy system
        self.economy = Economy(economy_data)
        self.inventory = Inventory(inventory_data)
        self.team = team_data if team_data is not None else []

    def get_Entity_Loader(self, pathToInfo) -> Player_Loader:
        """
        Get the entity loader
        :return Entity_Loader:
        """
        return Player_Loader(pathToInfo)

    def on_collision(self, entity: 'Entity') -> None:
        """
        On collision with another entity execute this method
        :param entity: entity that collided with the entity
        :return None:
        """
        self.collision_sound()
        entity.on_collision(self)

    def check_collision(self, x_movement: int, y_movement: int, entity: Union['Entity', None] = None) -> bool:
        """
        Check if the entity has colided with another entity
        :param entity: entity to check
        :return bool:
        """
        rect = self.rect
        rect.x += x_movement
        rect.y += y_movement
        if entity is None:
            for entity in self.external_entitys:
                if rect.colliderect(entity.rect):
                    self.on_collision(entity)
                    return True
        else:
            if rect.colliderect(entity.rect):
                return True
        return False

    def collision_sound(self) -> None:
        """
        Play collision sound
        :return None:
        """
        collision_sound: Game_Sound = Game_Sound(
            config.Sounds.collision, sound_volume=0.7)
        collision_sound.play()

    def update(self):
        pass
