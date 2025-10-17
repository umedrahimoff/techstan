#!/usr/bin/env python3
"""
Скрипт для настройки переменных окружения в Netlify
Требует установки: pip install netlify-py
"""

import os
import sys
from netlify import Netlify

def setup_netlify_env():
    """Настраивает переменные окружения в Netlify"""
    
    # Получаем токен Netlify из переменных окружения
    netlify_token = os.getenv('NETLIFY_TOKEN')
    site_id = os.getenv('NETLIFY_SITE_ID')
    
    if not netlify_token:
        print("❌ NETLIFY_TOKEN не найден в переменных окружения")
        print("Получите токен: https://app.netlify.com/user/applications#personal-access-tokens")
        return False
    
    if not site_id:
        print("❌ NETLIFY_SITE_ID не найден в переменных окружения")
        print("Найдите ID сайта в настройках Netlify")
        return False
    
    try:
        # Инициализируем клиент Netlify
        netlify = Netlify(netlify_token)
        
        # Переменные окружения для настройки
        env_vars = {
            'BOT_TOKEN': '8439861011:AAFGHb2RionJTnAGINhCtBxoqVu7fk8rZ3g',
            'MODERATION_GROUP_ID': '-4877957523',
            'CHANNEL_ID': '@techstannews',
            'CHECK_INTERVAL': '30'
        }
        
        print("🚀 Настраиваем переменные окружения в Netlify...")
        
        # Устанавливаем переменные окружения
        for key, value in env_vars.items():
            try:
                # Обновляем переменную окружения
                netlify.sites.update_site(
                    site_id=site_id,
                    body={'build_settings': {'env': {key: value}}}
                )
                print(f"✅ {key} = {value}")
            except Exception as e:
                print(f"❌ Ошибка при установке {key}: {e}")
        
        print("🎉 Переменные окружения успешно настроены!")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при настройке Netlify: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Настройка переменных окружения в Netlify")
    print("=" * 50)
    
    # Проверяем наличие необходимых переменных
    if not os.getenv('NETLIFY_TOKEN'):
        print("\n📝 Инструкции:")
        print("1. Получите токен Netlify: https://app.netlify.com/user/applications#personal-access-tokens")
        print("2. Найдите ID сайта в настройках Netlify")
        print("3. Установите переменные окружения:")
        print("   export NETLIFY_TOKEN='your_token_here'")
        print("   export NETLIFY_SITE_ID='your_site_id_here'")
        print("4. Запустите скрипт снова")
        sys.exit(1)
    
    success = setup_netlify_env()
    if success:
        print("\n✅ Готово! Теперь можете задеплоить проект.")
    else:
        print("\n❌ Произошла ошибка. Проверьте настройки.")
        sys.exit(1)
