from dotenv import load_dotenv
from pathlib import Path  # Python 3.6+ only

if not load_dotenv():
    env_path = Path('.') / '..' / '.env'
    load_dotenv(dotenv_path=env_path)

# here we just assume that when no .env file is present on this level or the project leve
# that we are in a k8 environment and the variables are supplied as actual env variables
