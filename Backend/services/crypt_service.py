import os

from cryptography.fernet import Fernet
# noinspection PyUnresolvedReferences
import loadenv


# https://devqa.io/encrypt-decrypt-data-python/

def generate_key():
    """
    Generates a key and save it into a file
    """
    key = Fernet.generate_key()
    print(key)


def load_key():
    """
    Load the previously generated key
    """
    return os.getenv('APP_KEY')


def encrypt_message(message):
    """
    Encrypts a message, returns binary
    """
    key = load_key()
    encoded_message = message.encode()
    f = Fernet(key)
    encrypted_message = f.encrypt(encoded_message)

    return encrypted_message


def decrypt_message(crypt_message):
    """
    Decrypts a crypt_message
    """
    key = load_key()
    f = Fernet(key)
    decrypted_message = f.decrypt(crypt_message).decode()

    return decrypted_message


if __name__ == "__main__":
    # generate_key()
    msg = encrypt_message("encrypt this message")
    print(msg)
    print(decrypt_message(msg))
