#!/usr/bin/env python3
"""
Netlify Function для запуска Telegram бота
Упрощенная версия для диагностики
"""

import sys
import os
import json
import logging
from datetime import datetime

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handler(event, context):
    """Основной обработчик Netlify Function"""
    try:
        logger.info("=== ЗАПУСК NETLIFY FUNCTION ===")
        
        # Проверяем переменные окружения
        bot_token = os.getenv('BOT_TOKEN')
        moderation_group_id = os.getenv('MODERATION_GROUP_ID')
        channel_id = os.getenv('CHANNEL_ID')
        check_interval = os.getenv('CHECK_INTERVAL', '30')
        
        logger.info(f"BOT_TOKEN: {'SET' if bot_token else 'NOT SET'}")
        logger.info(f"MODERATION_GROUP_ID: {moderation_group_id}")
        logger.info(f"CHANNEL_ID: {channel_id}")
        logger.info(f"CHECK_INTERVAL: {check_interval}")
        
        if not bot_token:
            logger.error("BOT_TOKEN не найден в переменных окружения!")
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': 'BOT_TOKEN not found in environment variables',
                    'message': 'Проверьте настройки переменных окружения в Netlify'
                })
            }
        
        # Тестируем импорт модулей
        try:
            logger.info("Тестируем импорт модулей...")
            
            # Добавляем путь к модулям
            src_path = os.path.join(os.path.dirname(__file__), '..', '..', 'src')
            sys.path.insert(0, src_path)
            
            logger.info(f"Добавлен путь: {src_path}")
            logger.info(f"Python path: {sys.path[:3]}")
            
            # Проверяем существование файлов
            telegram_bot_file = os.path.join(src_path, 'telegram_bot.py')
            config_file = os.path.join(src_path, '..', 'config.py')
            
            logger.info(f"telegram_bot.py exists: {os.path.exists(telegram_bot_file)}")
            logger.info(f"config.py exists: {os.path.exists(config_file)}")
            
            # Пробуем импортировать
            from telegram_bot import TelegramNewsBot
            logger.info("✅ TelegramNewsBot импортирован успешно")
            
            # Создаем бота
            bot = TelegramNewsBot()
            logger.info("✅ Бот создан успешно")
            
            # Отправляем тестовое сообщение
            import asyncio
            from telegram import Bot
            
            async def send_test_message():
                try:
                    telegram_bot = Bot(token=bot_token)
                    message = f"🧪 ТЕСТОВОЕ СООБЩЕНИЕ\n\n"
                    message += f"⏰ Время: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}\n"
                    message += f"🌐 Платформа: Netlify Functions\n"
                    message += f"✅ Бот работает!\n"
                    message += f"📢 Канал: {channel_id}"
                    
                    await telegram_bot.send_message(
                        chat_id=moderation_group_id,
                        text=message,
                        parse_mode='HTML'
                    )
                    logger.info("✅ Тестовое сообщение отправлено")
                    return True
                except Exception as e:
                    logger.error(f"❌ Ошибка при отправке сообщения: {e}")
                    return False
            
            # Запускаем тест
            result = asyncio.run(send_test_message())
            
            if result:
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Бот успешно запущен и протестирован!',
                        'timestamp': datetime.now().isoformat(),
                        'environment': {
                            'bot_token_set': bool(bot_token),
                            'moderation_group_id': moderation_group_id,
                            'channel_id': channel_id,
                            'check_interval': check_interval
                        }
                    })
                }
            else:
                return {
                    'statusCode': 500,
                    'body': json.dumps({
                        'error': 'Failed to send test message',
                        'message': 'Бот создан, но не смог отправить сообщение'
                    })
                }
                
        except ImportError as e:
            logger.error(f"❌ Ошибка импорта: {e}")
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': 'Import error',
                    'message': f'Ошибка импорта модулей: {str(e)}',
                    'python_path': sys.path[:5]
                })
            }
        except Exception as e:
            logger.error(f"❌ Общая ошибка: {e}")
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': 'General error',
                    'message': f'Общая ошибка: {str(e)}'
                })
            }
            
    except Exception as e:
        logger.error(f"❌ Критическая ошибка: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Critical error',
                'message': f'Критическая ошибка: {str(e)}'
            })
        }

if __name__ == "__main__":
    # Для локального тестирования
    result = handler({}, {})
    print(json.dumps(result, indent=2))