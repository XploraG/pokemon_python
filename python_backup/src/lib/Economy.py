import json
import time
import random
from typing import Optional


class Economy:
    """
    Central economy engine that manages coins, rewards, and conversions.

    Attributes:
        coins (int): Current coin balance.
        pusdt (float): Current pusdt balance.
        medals (list[str]): List of earned medal names.
        login_streak (int): Current consecutive login days.
        last_login_date (str): ISO date of last login.
        last_passive_claim (str): ISO timestamp of last passive claim.
        defeated_gyms (dict): Maps gym_id to number of defeats.
        trainer_cooldowns (dict): Maps trainer_id to last defeat timestamp.
        gym_cooldowns (dict): Maps gym_id to last defeat timestamp.
        daily_missions_progress (dict): Today's mission progress.
        total_coins_earned (int): Lifetime coins earned (for achievements).
        achievements_unlocked (list[str]): List of unlocked achievement IDs.
    """
    coins: int
    pusdt: float
    medals: list
    login_streak: int
    last_login_date: str
    last_passive_claim: str
    defeated_gyms: dict
    trainer_cooldowns: dict
    gym_cooldowns: dict
    daily_missions_progress: dict
    total_coins_earned: int
    achievements_unlocked: list

    # Config paths
    ECONOMY_CONFIG_PATH = 'src/assets/economy/config.json'
    TRAINER_REWARDS_PATH = 'src/assets/economy/trainer_rewards.json'
    GYM_REWARDS_PATH = 'src/assets/economy/gym_rewards.json'
    PASSIVE_RATES_PATH = 'src/assets/economy/passive_rates.json'
    LOGIN_REWARDS_PATH = 'src/assets/economy/login_rewards.json'
    DAILY_MISSIONS_PATH = 'src/assets/economy/daily_missions.json'

    def __init__(self, save_data: Optional[dict] = None):
        """
        Initialize the economy engine.
        :param save_data: Optional dict of previously saved economy data.
        """
        # Load configs
        self._config = self._load_json(self.ECONOMY_CONFIG_PATH)
        self._trainer_rewards = self._load_json(self.TRAINER_REWARDS_PATH)
        self._gym_rewards = self._load_json(self.GYM_REWARDS_PATH)
        self._passive_rates = self._load_json(self.PASSIVE_RATES_PATH)
        self._login_rewards = self._load_json(self.LOGIN_REWARDS_PATH)
        self._daily_missions = self._load_json(self.DAILY_MISSIONS_PATH)

        if save_data:
            self._load_from_save(save_data)
        else:
            self._initialize_defaults()

    def _load_json(self, path: str) -> dict:
        """Load a JSON file and return its contents."""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Config file not found: {path}")
            return {}

    def _initialize_defaults(self) -> None:
        """Set default values for a new game."""
        self.coins = self._config.get('starting_coins', 500)
        self.pusdt = 0.0
        self.medals = []
        self.login_streak = 0
        self.last_login_date = ''
        self.last_passive_claim = ''
        self.defeated_gyms = {}
        self.trainer_cooldowns = {}
        self.gym_cooldowns = {}
        self.daily_missions_progress = {}
        self.total_coins_earned = 0
        self.achievements_unlocked = []

    def _load_from_save(self, data: dict) -> None:
        """Load economy state from save data."""
        self.coins = data.get('coins', self._config.get('starting_coins', 500))
        self.pusdt = data.get('pusdt', 0.0)
        self.medals = data.get('medals', [])
        self.login_streak = data.get('login_streak', 0)
        self.last_login_date = data.get('last_login_date', '')
        self.last_passive_claim = data.get('last_passive_claim', '')
        self.defeated_gyms = data.get('defeated_gyms', {})
        self.trainer_cooldowns = data.get('trainer_cooldowns', {})
        self.gym_cooldowns = data.get('gym_cooldowns', {})
        self.daily_missions_progress = data.get('daily_missions_progress', {})
        self.total_coins_earned = data.get('total_coins_earned', 0)
        self.achievements_unlocked = data.get('achievements_unlocked', [])

    def to_save_data(self) -> dict:
        """Serialize economy state for saving."""
        return {
            'coins': self.coins,
            'pusdt': self.pusdt,
            'medals': self.medals,
            'login_streak': self.login_streak,
            'last_login_date': self.last_login_date,
            'last_passive_claim': self.last_passive_claim,
            'defeated_gyms': self.defeated_gyms,
            'trainer_cooldowns': self.trainer_cooldowns,
            'gym_cooldowns': self.gym_cooldowns,
            'daily_missions_progress': self.daily_missions_progress,
            'total_coins_earned': self.total_coins_earned,
            'achievements_unlocked': self.achievements_unlocked
        }

    # ---- COIN OPERATIONS ----

    def add_coins(self, amount: int) -> int:
        """Add coins to balance. Returns new balance."""
        self.coins += amount
        self.total_coins_earned += amount
        return self.coins

    def spend_coins(self, amount: int) -> bool:
        """Spend coins. Returns True if successful, False if insufficient."""
        if self.coins >= amount:
            self.coins -= amount
            return True
        return False

    def convert_to_pusdt(self, coin_amount: int) -> float:
        """
        Convert coins to pusdt.
        :param coin_amount: Amount of coins to convert (must be multiple of rate).
        :return: Amount of pusdt received.
        """
        rate = self._config.get('coins_to_pusdt_rate', 10000)
        if coin_amount < rate or self.coins < coin_amount:
            return 0.0
        # Only convert full units
        units = coin_amount // rate
        actual_cost = units * rate
        if self.spend_coins(actual_cost):
            pusdt_earned = float(units)
            self.pusdt += pusdt_earned
            return pusdt_earned
        return 0.0

    # ---- BATTLE REWARDS ----

    def get_trainer_reward(self, difficulty: str, trainer_id: str = '') -> int:
        """
        Calculate and award coins for defeating a trainer.
        :param difficulty: Trainer difficulty key (basic, pre_intermediate, intermediate, hard).
        :param trainer_id: Optional trainer ID for cooldown tracking.
        :return: Coins awarded (0 if on cooldown).
        """
        # Check cooldown
        if trainer_id and trainer_id in self.trainer_cooldowns:
            cooldown_hours = self._config.get('trainer_rebattle_cooldown_hours', 6)
            last_time = self.trainer_cooldowns[trainer_id]
            if time.time() - last_time < cooldown_hours * 3600:
                return 0

        # Get reward range
        reward_config = self._trainer_rewards.get(difficulty, {})
        min_coins = reward_config.get('min_coins', 10)
        max_coins = reward_config.get('max_coins', 20)
        coins = random.randint(min_coins, max_coins)

        # Award coins and update cooldown
        self.add_coins(coins)
        if trainer_id:
            self.trainer_cooldowns[trainer_id] = time.time()

        return coins

    def get_gym_reward(self, gym_id: int) -> tuple:
        """
        Calculate and award coins/medals for defeating a gym leader.
        :param gym_id: The gym ID (1-8).
        :return: Tuple of (coins_awarded, medal_name_or_None, is_first_victory).
        """
        gym_id_str = str(gym_id)

        # Check cooldown
        if gym_id_str in self.gym_cooldowns:
            cooldown_hours = self._config.get('gym_rebattle_cooldown_hours', 24)
            last_time = self.gym_cooldowns[gym_id_str]
            if time.time() - last_time < cooldown_hours * 3600:
                return (0, None, False)

        # Find gym config
        gym_config = None
        for gym in self._gym_rewards.get('gyms', []):
            if gym['id'] == gym_id:
                gym_config = gym
                break

        if not gym_config:
            return (0, None, False)

        # Determine if first victory
        times_defeated = self.defeated_gyms.get(gym_id_str, 0)
        is_first = times_defeated == 0

        # Calculate coins
        min_coins = gym_config['min_coins']
        max_coins = gym_config['max_coins']
        coins = random.randint(min_coins, max_coins)

        medal = None
        if is_first:
            coins += gym_config.get('first_victory_bonus', 0)
            medal = gym_config.get('medal', '')
            if medal:
                self.medals.append(medal)

        # Award and track
        self.add_coins(coins)
        self.defeated_gyms[gym_id_str] = times_defeated + 1
        self.gym_cooldowns[gym_id_str] = time.time()

        return (coins, medal, is_first)

    # ---- PASSIVE GENERATION ----

    def calculate_passive_income(self, team: list) -> int:
        """
        Calculate total passive income from the team.
        :param team: List of dicts with 'rarity' and 'is_evolved' keys.
        :return: Total coins claimable.
        """
        max_team = self._config.get('max_team_size', 6)
        team_to_calc = team[:max_team]

        total = 0
        for pokemon in team_to_calc:
            rarity = pokemon.get('rarity', 'common')
            rate_config = self._passive_rates.get(rarity, {})
            base_coins = rate_config.get('coins_per_day', 500)

            if pokemon.get('is_evolved', False):
                bonus = rate_config.get('evolution_bonus', 1.25)
                base_coins = int(base_coins * bonus)

            total += base_coins

        return total

    def claim_passive_income(self, team: list) -> int:
        """
        Claim passive income from team. Only works once per 24h.
        :param team: List of pokemon dicts.
        :return: Coins claimed (0 if not available).
        """
        claim_interval = self._config.get('passive_claim_interval_hours', 24)

        if self.last_passive_claim:
            elapsed = time.time() - float(self.last_passive_claim)
            if elapsed < claim_interval * 3600:
                return 0

        coins = self.calculate_passive_income(team)
        self.add_coins(coins)
        self.last_passive_claim = str(time.time())
        return coins

    def get_passive_time_remaining(self) -> float:
        """
        Get seconds remaining until next passive claim.
        :return: Seconds remaining (0 if claimable).
        """
        if not self.last_passive_claim:
            return 0.0
        claim_interval = self._config.get('passive_claim_interval_hours', 24)
        elapsed = time.time() - float(self.last_passive_claim)
        remaining = (claim_interval * 3600) - elapsed
        return max(0.0, remaining)

    # ---- LOGIN STREAK ----

    def check_login_streak(self) -> dict:
        """
        Check and update login streak. Call once when game starts.
        :return: Dict with 'streak', 'reward_coins', 'reward_items', 'streak_broken'.
        """
        from datetime import date
        today = date.today().isoformat()

        if today == self.last_login_date:
            return {'streak': self.login_streak, 'reward_coins': 0, 'reward_items': {}, 'streak_broken': False}

        yesterday = date.fromordinal(date.today().toordinal() - 1).isoformat()
        streak_broken = False

        if self.last_login_date == yesterday:
            self.login_streak += 1
        elif self.last_login_date == '':
            self.login_streak = 1
        else:
            streak_broken = True
            self.login_streak = 1

        self.last_login_date = today

        # Find applicable reward
        reward_coins = 0
        reward_items = {}
        for reward in self._login_rewards.get('rewards', []):
            if self.login_streak >= reward['day']:
                reward_coins = reward['coins']
                reward_items = reward.get('items', {})

        if reward_coins > 0:
            self.add_coins(reward_coins)

        return {
            'streak': self.login_streak,
            'reward_coins': reward_coins,
            'reward_items': reward_items,
            'streak_broken': streak_broken
        }

    # ---- DAILY MISSIONS ----

    def update_mission_progress(self, mission_type: str, amount: int = 1) -> list:
        """
        Update progress for missions of the given type.
        :param mission_type: The type of mission (battle, capture, visit, claim, spend).
        :param amount: How much progress to add.
        :return: List of completed mission IDs this update.
        """
        completed = []
        for mission in self._daily_missions.get('missions', []):
            if mission['type'] == mission_type:
                mid = mission['id']
                current = self.daily_missions_progress.get(mid, 0)
                if current < mission['target']:
                    new_progress = current + amount
                    self.daily_missions_progress[mid] = new_progress
                    if new_progress >= mission['target']:
                        self.add_coins(mission['reward_coins'])
                        completed.append(mid)
        return completed

    def get_formatted_coins(self) -> str:
        """Return coins formatted with commas for display."""
        return f"{self.coins:,}"

    def get_formatted_pusdt(self) -> str:
        """Return pusdt formatted for display."""
        return f"{self.pusdt:.2f}"
