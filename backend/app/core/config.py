from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    MONGODB_URL: str = "mongodb://localhost:27017/smart_kanban_sync"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days

    FERNET_KEY: str  # base64-encoded 32-byte key; generate with Fernet.generate_key()

    FRONTEND_URL: str = "http://localhost:3000"

    ASANA_CLIENT_ID: str
    ASANA_CLIENT_SECRET: str

    TRELLO_API_KEY: str
    TRELLO_API_SECRET: str

    MONDAY_CLIENT_ID: str
    MONDAY_CLIENT_SECRET: str

    JIRA_CLIENT_ID: str
    JIRA_CLIENT_SECRET: str

    LINEAR_CLIENT_ID: str
    LINEAR_CLIENT_SECRET: str

    OPENAI_API_KEY: str


settings = Settings()
