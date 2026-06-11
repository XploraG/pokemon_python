class Colors:
    black: str = '#5a5a52'
    white: str = '#ffffff'
    red: str = '#ff0000'
    green: str = '#00ff00'
    blue: str = '#0000ff'
    purple: str = '#6363ff'


SCALE: int = 1
FONT_SIZE: int = 15*SCALE
FPS: int = 24
IMAGES_PATH = 'src/assets/imgs/'
DEV_MODE = False

PLAYER_PATH: str = 'src/assets/entities/player/main.json'
SAVES_PATH: str = 'src/assets/saves/main.json'
FONT_PATH: str = 'src/assets/fonts/main.ttf'
FONT_PATH2: str = 'src/assets/fonts/pokemon.ttf'
SOUNDS_PATH: str = 'src/assets/sounds/'
MUSIC_PATH: str = 'src/assets/music/'
DEFAULT_MAP: str = "src/assets/maps/tutorial/main.json"
Resolution = (640*SCALE, 480*SCALE)

# Economy paths
ECONOMY_CONFIG_PATH: str = 'src/assets/economy/config.json'
TRAINER_REWARDS_PATH: str = 'src/assets/economy/trainer_rewards.json'
GYM_REWARDS_PATH: str = 'src/assets/economy/gym_rewards.json'
PASSIVE_RATES_PATH: str = 'src/assets/economy/passive_rates.json'
LOGIN_REWARDS_PATH: str = 'src/assets/economy/login_rewards.json'
DAILY_MISSIONS_PATH: str = 'src/assets/economy/daily_missions.json'
ITEMS_POKEBALLS_PATH: str = 'src/assets/items/pokeballs.json'
ITEMS_POTIONS_PATH: str = 'src/assets/items/potions.json'
ITEMS_BOOSTS_PATH: str = 'src/assets/items/boosts.json'
SHOP_POKEMART_PATH: str = 'src/assets/shops/pokemart.json'


class Music:
    menu: str = MUSIC_PATH + 'menu.mp3'
    game: str = MUSIC_PATH + 'game.mp3'
    game_over: str = MUSIC_PATH + 'game_over.mp3'
    battle: str = MUSIC_PATH + 'battle.mp3'


class Sounds:
    collision: str = SOUNDS_PATH + 'collision.mp3'
    click: str = SOUNDS_PATH + 'click.mp3'
