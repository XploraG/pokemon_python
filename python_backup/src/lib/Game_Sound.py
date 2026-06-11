import pygame


class Game_Sound:
    """
    Class that create new sounds for the game

    :param sound_path: path to the sound file
    :param sound_volume: volume of the sound
    :param should_sound_infinite: if the sound should be played infinitely
    """
    should_sound_infinite: bool
    sound_path: str
    sound_volume: float
    sound: pygame.mixer.Sound

    def __init__(self, sound_path: str, sound_volume: float = 0.5, should_sound_infinite: bool = False):
        self.should_sound_infinite = should_sound_infinite
        self.sound_path = sound_path
        self.sound_volume = sound_volume
        try:
            self.sound = pygame.mixer.Sound(self.sound_path)
            self.sound.set_volume(self.sound_volume)
        except Exception as e:
            print(f"Warning: Could not load sound {sound_path}: {e}")
            self.sound = None

    def play(self):
        if self.sound:
            try:
                if self.should_sound_infinite:
                    self.sound.play(-1)
                else:
                    self.sound.play()
            except Exception as e:
                print(f"Warning: Could not play sound {self.sound_path}: {e}")

    def stop(self):
        if self.sound:
            try:
                self.sound.stop()
            except Exception as e:
                print(f"Warning: Could not stop sound {self.sound_path}: {e}")
