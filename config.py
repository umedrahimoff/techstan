import os
from dotenv import load_dotenv

load_dotenv()

# Telegram Bot Configuration
BOT_TOKEN = os.getenv("BOT_TOKEN")
MODERATION_GROUP_ID = int(os.getenv("MODERATION_GROUP_ID", "-4877957523"))
CHANNEL_ID = os.getenv("CHANNEL_ID", "@techstannews")

# News Sources
NEWS_SOURCES = [
    {
        "name": "Digital Business",
        "url": "https://digitalbusiness.kz/",
        "enabled": True
    },
    {
        "name": "Spot.uz",
        "url": "https://spot.uz/",
        "enabled": True
    },
    {
        "name": "The Tech",
        "url": "https://the-tech.kz/",
        "enabled": True
    },
    {
        "name": "Blue Screen",
        "url": "https://bluescreen.kz/",
        "enabled": True
    }
]

# Keywords for filtering tech news
TECH_KEYWORDS = [
    # Russian keywords
    "стартап", "стартапы", "инвестиции", "инвестиция", "технологии", "технология",
    "искусственный интеллект", "ИИ", "блокчейн", "криптовалюта", "криптовалюты",
    "финтех", "финтех", "цифровизация", "цифровая трансформация", "IT", "айти",
    "программирование", "разработка", "софт", "софт", "приложение", "приложения",
    "мобильное приложение", "веб-разработка", "данные", "большие данные",
    "машинное обучение", "нейросеть", "нейросети", "автоматизация", "робот",
    "роботы", "инновации", "инновация", "венчурный", "венчур", "акселератор",
    "инкубатор", "технопарк", "хакатон", "конференция", "IT-конференция",
    "цифровая экономика", "электронная коммерция", "e-commerce", "онлайн",
    "платежная система", "банковские технологии", "финансовые технологии",
    "регулятивные технологии", "regtech", "суптех", "insurtech", "proptech",
    "edtech", "healthtech", "agritech", "cleantech", "greentech",
    "умный город", "интернет вещей", "IoT", "5G", "6G", "облачные технологии",
    "облако", "микросервисы", "контейнеризация", "DevOps", "кибербезопасность",
    "безопасность", "защита данных", "персональные данные", "GDPR",
    "электронная подпись", "цифровая идентификация", "биометрия",
    "виртуальная реальность", "VR", "дополненная реальность", "AR",
    "метавселенная", "NFT", "токен", "токены", "DeFi", "Web3",
    "центральная азия", "казахстан", "узбекистан", "кыргызстан", "таджикистан",
    "туркменистан", "алматы", "астана", "нур-султан", "ташкент", "бишкек",
    "душанбе", "ашхабад",
    
    # English keywords
    "startup", "startups", "investment", "investments", "technology", "tech",
    "artificial intelligence", "AI", "blockchain", "cryptocurrency", "crypto",
    "fintech", "digitalization", "digital transformation", "programming",
    "development", "software", "application", "apps", "mobile app", "web development",
    "data", "big data", "machine learning", "neural network", "automation",
    "robot", "robots", "innovation", "venture", "accelerator", "incubator",
    "tech park", "hackathon", "conference", "IT conference", "digital economy",
    "e-commerce", "online", "payment system", "banking technology", "financial technology",
    "regulatory technology", "regtech", "suptech", "insurtech", "proptech",
    "edtech", "healthtech", "agritech", "cleantech", "greentech",
    "smart city", "internet of things", "IoT", "cloud technology", "cloud",
    "microservices", "containerization", "cybersecurity", "security",
    "data protection", "personal data", "electronic signature", "digital identification",
    "biometrics", "virtual reality", "augmented reality", "metaverse",
    "central asia", "kazakhstan", "uzbekistan", "kyrgyzstan", "tajikistan",
    "turkmenistan", "almaty", "astana", "nur-sultan", "tashkent", "bishkek",
    "dushanbe", "ashgabat"
]

# Check interval in minutes
CHECK_INTERVAL = int(os.getenv("CHECK_INTERVAL", "30"))
