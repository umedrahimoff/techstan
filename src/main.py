#!/usr/bin/env python3
"""
Главный файл для запуска бота мониторинга новостей
"""

import asyncio
import logging
import sys
import os
from datetime import datetime

# Добавляем путь к модулям
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from telegram_bot import TelegramNewsBot

def setup_logging():
    """Настройка логирования"""
    # Создаем папку для логов если не существует
    os.makedirs('logs', exist_ok=True)
    
    # Настройка форматирования
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Настройка файлового логгера
    file_handler = logging.FileHandler(
        f'logs/bot_{datetime.now().strftime("%Y%m%d")}.log',
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)
    
    # Настройка консольного логгера
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)
    
    # Настройка корневого логгера
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    # Настройка логгеров для внешних библиотек
    logging.getLogger('telegram').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('requests').setLevel(logging.WARNING)

async def main():
    """Основная функция запуска бота"""
    print("🚀 Запуск бота мониторинга технологических новостей...")
    
    try:
        # Настраиваем логирование
        setup_logging()
        logger = logging.getLogger(__name__)
        logger.info("Запуск бота мониторинга новостей")
        
        # Создаем и запускаем бота
        bot = TelegramNewsBot()
        bot.run()
        
    except KeyboardInterrupt:
        print("\n⏹️ Бот остановлен пользователем")
        logging.info("Бот остановлен пользователем")
    except Exception as e:
        print(f"❌ Ошибка при запуске бота: {e}")
        logging.error(f"Ошибка при запуске бота: {e}")
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⏹️ Бот остановлен")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        sys.exit(1)
