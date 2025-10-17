import requests
from bs4 import BeautifulSoup
import re
import logging
from typing import List, Dict
from abc import ABC, abstractmethod
from config import TECH_KEYWORDS

# Настройка логирования
logger = logging.getLogger(__name__)

class BaseNewsParser(ABC):
    """Базовый класс для парсинга новостей"""
    
    def __init__(self, base_url: str, source_name: str):
        self.base_url = base_url
        self.source_name = source_name
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def parse_news(self) -> List[Dict]:
        """Основной метод парсинга новостей"""
        try:
            logger.info(f"Парсинг новостей с {self.base_url}")
            response = self.session.get(self.base_url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            news_items = []
            
            # Ищем статьи
            articles = self._find_articles(soup)
            
            for article in articles:
                try:
                    news_item = self._extract_news_item(article)
                    if news_item and self.is_tech_news(news_item['title']):
                        news_items.append(news_item)
                except Exception as e:
                    logger.warning(f"Ошибка при обработке статьи: {e}")
                    continue
            
            logger.info(f"Найдено {len(news_items)} технологических новостей с {self.source_name}")
            return news_items
            
        except Exception as e:
            logger.error(f"Ошибка при парсинге {self.base_url}: {e}")
            return []
    
    def _find_articles(self, soup: BeautifulSoup) -> List:
        """Находит статьи на странице"""
        # Ищем статьи в разных секциях
        articles = soup.find_all(['article', 'div'], class_=re.compile(r'(article|news|post|item|card)'))
        
        # Если не нашли по классам, ищем по структуре
        if not articles:
            headlines = soup.find_all(['h1', 'h2', 'h3', 'h4'], string=re.compile(r'.+'))
            for headline in headlines:
                parent = headline.find_parent(['article', 'div', 'a'])
                if parent:
                    articles.append(parent)
        
        return articles
    
    def _extract_news_item(self, article) -> Dict:
        """Извлекает данные новости из элемента"""
        # Ищем заголовок
        title_elem = article.find(['h1', 'h2', 'h3', 'h4', 'a'], string=re.compile(r'.+'))
        if not title_elem:
            return None
        
        title = title_elem.get_text(strip=True)
        if not title or len(title) < 10:
            return None
        
        # Ищем ссылку
        link_elem = article.find('a', href=True)
        if not link_elem:
            if title_elem.name == 'a' and title_elem.get('href'):
                link = title_elem.get('href')
            else:
                return None
        else:
            link = link_elem.get('href')
        
        # Обрабатываем относительные ссылки
        if link.startswith('/'):
            link = self.base_url.rstrip('/') + link
        elif not link.startswith('http'):
            return None
        
        return {
            'title': title,
            'link': link,
            'source': self.source_name
        }
    
    def is_tech_news(self, title: str) -> bool:
        """Проверяет, содержит ли заголовок ключевые слова технологических новостей"""
        title_lower = title.lower()
        
        # Основные категории ключевых слов
        startup_keywords = [
            "стартап", "стартапы", "startup", "startups", "единорог", "unicorn",
            "акселератор", "инкубатор", "accelerator", "incubator", "венчур", "venture"
        ]
        
        investment_keywords = [
            "инвестиции", "инвестиция", "investment", "investments", "финансирование",
            "funding", "раунд", "round", "серия", "series", "капитал", "capital",
            "фонд", "fund", "инвестор", "investor", "спонсор", "sponsor"
        ]
        
        tech_keywords = [
            "технологии", "технология", "technology", "tech", "искусственный интеллект",
            "ИИ", "AI", "блокчейн", "blockchain", "криптовалюта", "crypto", "финтех",
            "fintech", "цифровизация", "digital", "IT", "айти", "программирование",
            "programming", "разработка", "development", "софт", "software", "приложение",
            "application", "данные", "data", "машинное обучение", "machine learning",
            "нейросеть", "neural network", "автоматизация", "automation", "робот",
            "robot", "инновации", "innovation", "интернет вещей", "IoT", "облако",
            "cloud", "кибербезопасность", "cybersecurity", "VR", "AR", "метавселенная",
            "metaverse", "Web3", "DeFi", "NFT", "токен", "token"
        ]
        
        company_keywords = [
            "компания", "компании", "company", "компаний", "корпорация", "corporation",
            "фирма", "firm", "предприятие", "enterprise", "организация", "organization",
            "бизнес", "business", "предпринимательство", "entrepreneurship"
        ]
        
        # Проверяем наличие ключевых слов по категориям
        has_startup = any(keyword in title_lower for keyword in startup_keywords)
        has_investment = any(keyword in title_lower for keyword in investment_keywords)
        has_tech = any(keyword in title_lower for keyword in tech_keywords)
        has_company = any(keyword in title_lower for keyword in company_keywords)
        
        # Логика фильтрации: должна быть комбинация технологий + (стартапы/инвестиции/компании)
        if has_tech and (has_startup or has_investment or has_company):
            return True
        
        # Также проверяем общие ключевые слова из конфига
        for keyword in TECH_KEYWORDS:
            if keyword.lower() in title_lower:
                return True
        
        return False

class DigitalBusinessParser(BaseNewsParser):
    """Парсер для digitalbusiness.kz"""
    
    def __init__(self):
        super().__init__("https://digitalbusiness.kz/", "Digital Business")

class SpotUzParser(BaseNewsParser):
    """Парсер для spot.uz"""
    
    def __init__(self):
        super().__init__("https://spot.uz/", "Spot.uz")

class TheTechParser(BaseNewsParser):
    """Парсер для the-tech.kz"""
    
    def __init__(self):
        super().__init__("https://the-tech.kz/", "The Tech")

class BlueScreenParser(BaseNewsParser):
    """Парсер для bluescreen.kz"""
    
    def __init__(self):
        super().__init__("https://bluescreen.kz/", "Blue Screen")

class NewsParser:
    """Основной класс для парсинга новостей из всех источников"""
    
    def __init__(self):
        self.parsers = [
            DigitalBusinessParser(),
            SpotUzParser(),
            TheTechParser(),
            BlueScreenParser()
        ]
    
    def get_all_news(self) -> List[Dict]:
        """Получает все новости из всех источников"""
        all_news = []
        
        for parser in self.parsers:
            try:
                news = parser.parse_news()
                all_news.extend(news)
            except Exception as e:
                logger.error(f"Ошибка при парсинге {parser.source_name}: {e}")
                continue
        
        logger.info(f"Всего найдено {len(all_news)} новостей из всех источников")
        return all_news
