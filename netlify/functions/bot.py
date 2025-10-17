#!/usr/bin/env python3
"""
Netlify Function для запуска Telegram бота
"""

import sys
import os
import asyncio
import logging
from datetime import datetime

# Добавляем путь к модулям
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from telegram_bot import TelegramNewsBot

def setup_logging():
    """Настройка логирования для Netlify"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

def handler(event, context):
    """Основной обработчик Netlify Function"""
    try:
        setup_logging()
        logger = logging.getLogger(__name__)
        logger.info("Запуск Telegram бота через Netlify Function")
        
        # Создаем и запускаем бота
        bot = TelegramNewsBot()
        
        # Запускаем бота в отдельном потоке
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Запускаем бота
            loop.run_until_complete(bot.run_async())
        except KeyboardInterrupt:
            logger.info("Бот остановлен")
        except Exception as e:
            logger.error(f"Ошибка при запуске бота: {e}")
            raise
        
        return {
            'statusCode': 200,
            'body': 'Bot started successfully'
        }
        
    except Exception as e:
        logger.error(f"Критическая ошибка: {e}")
        return {
            'statusCode': 500,
            'body': f'Error: {str(e)}'
        }

if __name__ == "__main__":
    # Для локального тестирования
    result = handler({}, {})
    print(result)
