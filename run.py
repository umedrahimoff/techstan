#!/usr/bin/env python3
"""
Скрипт для запуска бота мониторинга новостей
"""

import sys
import os

# Добавляем путь к src
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from main import main
import asyncio

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⏹️ Бот остановлен")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        sys.exit(1)
