import os

import bcrypt


def load_key():
    return os.getenv('APP_HASH_SALT').encode()


def create_hash(message):
    if isinstance(message, str):
        message = message.encode()
    return bcrypt.hashpw(message, load_key())


def check_hash(message, hashed):
    if isinstance(message, str):
        message = message.encode()
    if isinstance(hashed, str):
        hashed = hashed.encode()
    return bcrypt.checkpw(message, hashed)
