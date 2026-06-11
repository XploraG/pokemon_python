import json
from typing import Optional


class Inventory:
    """
    Manages the player's item inventory.

    Attributes:
        items (dict): Maps item_id to quantity.
        _item_catalogs (dict): Cached item definitions from JSON files.
    """
    items: dict
    _item_catalogs: dict

    # Catalog file paths
    POKEBALLS_PATH = 'src/assets/items/pokeballs.json'
    POTIONS_PATH = 'src/assets/items/potions.json'
    BOOSTS_PATH = 'src/assets/items/boosts.json'

    def __init__(self, save_data: Optional[dict] = None):
        """
        Initialize the inventory.
        :param save_data: Optional dict of saved inventory data.
        """
        self._item_catalogs = {}
        self._load_catalogs()

        if save_data:
            self.items = save_data.get('items', {})
        else:
            self.items = {}

    def _load_json(self, path: str) -> dict:
        """Load a JSON file and return its contents."""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Catalog file not found: {path}")
            return {}

    def _load_catalogs(self) -> None:
        """Load all item catalogs."""
        pokeballs = self._load_json(self.POKEBALLS_PATH)
        potions = self._load_json(self.POTIONS_PATH)
        boosts = self._load_json(self.BOOSTS_PATH)
        self._item_catalogs = {**pokeballs, **potions, **boosts}

    def add_item(self, item_id: str, quantity: int = 1) -> int:
        """
        Add items to inventory.
        :param item_id: The item identifier.
        :param quantity: How many to add.
        :return: New quantity of this item.
        """
        current = self.items.get(item_id, 0)
        self.items[item_id] = current + quantity
        return self.items[item_id]

    def remove_item(self, item_id: str, quantity: int = 1) -> bool:
        """
        Remove items from inventory.
        :param item_id: The item identifier.
        :param quantity: How many to remove.
        :return: True if successful, False if insufficient.
        """
        current = self.items.get(item_id, 0)
        if current >= quantity:
            self.items[item_id] = current - quantity
            if self.items[item_id] == 0:
                del self.items[item_id]
            return True
        return False

    def has_item(self, item_id: str, quantity: int = 1) -> bool:
        """
        Check if inventory has enough of an item.
        :param item_id: The item identifier.
        :param quantity: Minimum quantity needed.
        :return: True if enough, False otherwise.
        """
        return self.items.get(item_id, 0) >= quantity

    def get_quantity(self, item_id: str) -> int:
        """
        Get the quantity of an item.
        :param item_id: The item identifier.
        :return: Current quantity.
        """
        return self.items.get(item_id, 0)

    def get_item_info(self, item_id: str) -> dict:
        """
        Get the catalog information for an item.
        :param item_id: The item identifier.
        :return: Item info dict or empty dict.
        """
        return self._item_catalogs.get(item_id, {})

    def get_all_items(self) -> list:
        """
        Get all items in inventory with their info.
        :return: List of dicts with 'id', 'quantity', and catalog info.
        """
        result = []
        for item_id, quantity in self.items.items():
            info = self.get_item_info(item_id)
            result.append({
                'id': item_id,
                'quantity': quantity,
                **info
            })
        return result

    def to_save_data(self) -> dict:
        """Serialize inventory for saving."""
        return {
            'items': dict(self.items)
        }
