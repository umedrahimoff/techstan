#!/usr/bin/env python3
"""
Простой тест бота для диагностики
"""

import os
import sys
import asyncio
from datetime import datetime

# Добавляем путь к модулям
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_imports():
    """Тестирует импорт модулей"""
    print("🧪 Тестируем импорт модулей...")
    
    try:
        from config import BOT_TOKEN, MODERATION_GROUP_ID, CHANNEL_ID, CHECK_INTERVAL
        print(f"✅ config.py импортирован")
        print(f"BOT_TOKEN: {'SET' if BOT_TOKEN else 'NOT SET'}")
        print(f"MODERATION_GROUP_ID: {MODERATION_GROUP_ID}")
        print(f"CHANNEL_ID: {CHANNEL_ID}")
        print(f"CHECK_INTERVAL: {CHECK_INTERVAL}")
        return True
    except Exception as e:
        print(f"❌ Ошибка импорта config.py: {e}")
        return False

def test_telegram_bot():
    """Тестирует создание бота"""
    print("\n🤖 Тестируем создание бота...")
    
    try:
        from telegram_bot import TelegramNewsBot
        bot = TelegramNewsBot()
        print("✅ TelegramNewsBot создан успешно")
        return True
    except Exception as e:
        print(f"❌ Ошибка создания бота: {e}")
        return False

async def test_telegram_connection():
    """Тестирует подключение к Telegram"""
    print("\n📱 Тестируем подключение к Telegram...")
    
    try:
        from telegram import Bot
        from config import BOT_TOKEN, MODERATION_GROUP_ID
        
        bot = Bot(token=BOT_TOKEN)
        
        # Получаем информацию о боте
        bot_info = await bot.get_me()
        print(f"✅ Бот подключен: @{bot_info.username}")
        
        # Отправляем тестовое сообщение
        message = f"🧪 ТЕСТ ЛОКАЛЬНОГО ЗАПУСКА\n\n"
        message += f"⏰ Время: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}\n"
        message += f"🌐 Платформа: Локальный тест\n"
        message += f"✅ Бот работает локально!\n"
        
        await bot.send_message(
            chat_id=MODERATION_GROUP_ID,
            text=message,
            parse_mode='HTML'
        )
        print("✅ Тестовое сообщение отправлено")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка подключения к Telegram: {e}")
        return False

async def main():
    """Основная функция тестирования"""
    print("🚀 Запуск диагностики бота...")
    print("=" * 50)
    
    # Тест 1: Импорт модулей
    if not test_imports():
        print("\n❌ Тест импорта провален")
        return
    
    # Тест 2: Создание бота
    if not test_telegram_bot():
        print("\n❌ Тест создания бота провален")
        return
    
    # Тест 3: Подключение к Telegram
    if not await test_telegram_connection():
        print("\n❌ Тест подключения к Telegram провален")
        return
    
    print("\n🎉 Все тесты пройдены успешно!")
    print("Бот должен работать локально")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⏹️ Тест остановлен")
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
