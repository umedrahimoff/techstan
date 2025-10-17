#!/usr/bin/env python3
"""
Скрипт для запуска веб-админки
"""

import sys
import os

# Добавляем путь к src
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from admin import app, socketio

if __name__ == "__main__":
    print("🚀 Запуск веб-админки...")
    print("📊 Дашборд: http://localhost:5000")
    print("📰 Управление новостями: http://localhost:5000/news")
    print("🛑 Для остановки нажмите Ctrl+C")
    
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
