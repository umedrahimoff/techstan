#!/usr/bin/env python3
"""
Веб-админка для управления ботом мониторинга новостей
"""

import os
import json
import logging
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_socketio import SocketIO, emit
import threading
import time

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
socketio = SocketIO(app, cors_allowed_origins="*")

class AdminPanel:
    def __init__(self):
        self.data_dir = 'data'
        self.bot_running = False
        self.bot_thread = None
        self.stats = {
            'last_check': None,
            'total_news': 0,
            'pending_news': 0,
            'published_news': 0,
            'rejected_news': 0
        }
    
    def load_statistics(self):
        """Загружает статистику"""
        try:
            stats_file = os.path.join(self.data_dir, 'statistics.json')
            if os.path.exists(stats_file):
                with open(stats_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Ошибка при загрузке статистики: {e}")
        
        return {
            'parsed_today': 0,
            'published_today': 0,
            'rejected_today': 0,
            'total_parsed': 0,
            'total_published': 0,
            'total_rejected': 0,
            'last_reset_date': datetime.now().strftime('%Y-%m-%d')
        }
    
    def load_pending_news(self):
        """Загружает новости на модерации"""
        try:
            pending_file = os.path.join(self.data_dir, 'pending_news.json')
            if os.path.exists(pending_file):
                with open(pending_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Ошибка при загрузке pending_news: {e}")
        return []
    
    def load_published_news(self):
        """Загружает опубликованные новости"""
        try:
            published_file = os.path.join(self.data_dir, 'published_news.json')
            if os.path.exists(published_file):
                with open(published_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Ошибка при загрузке published_news: {e}")
        return []
    
    def save_pending_news(self, news_list):
        """Сохраняет новости на модерации"""
        try:
            pending_file = os.path.join(self.data_dir, 'pending_news.json')
            with open(pending_file, 'w', encoding='utf-8') as f:
                json.dump(news_list, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Ошибка при сохранении pending_news: {e}")
    
    def approve_news(self, news_id):
        """Одобряет новость"""
        try:
            pending_news = self.load_pending_news()
            published_news = self.load_published_news()
            
            # Находим новость
            news_to_approve = None
            for i, news in enumerate(pending_news):
                if news.get('id') == news_id:
                    news_to_approve = news
                    break
            
            if news_to_approve:
                # Добавляем timestamp
                news_to_approve['timestamp'] = datetime.now().isoformat()
                published_news.append(news_to_approve)
                
                # Удаляем из pending
                pending_news = [news for news in pending_news if news.get('id') != news_id]
                
                # Сохраняем изменения
                self.save_pending_news(pending_news)
                self.save_published_news(published_news)
                
                # Обновляем статистику
                self.update_statistics('published')
                
                return True
        except Exception as e:
            logger.error(f"Ошибка при одобрении новости: {e}")
        return False
    
    def reject_news(self, news_id):
        """Отклоняет новость"""
        try:
            pending_news = self.load_pending_news()
            
            # Удаляем из pending
            pending_news = [news for news in pending_news if news.get('id') != news_id]
            self.save_pending_news(pending_news)
            
            # Обновляем статистику
            self.update_statistics('rejected')
            
            return True
        except Exception as e:
            logger.error(f"Ошибка при отклонении новости: {e}")
        return False
    
    def save_published_news(self, news_list):
        """Сохраняет опубликованные новости"""
        try:
            published_file = os.path.join(self.data_dir, 'published_news.json')
            with open(published_file, 'w', encoding='utf-8') as f:
                json.dump(news_list, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Ошибка при сохранении published_news: {e}")
    
    def update_statistics(self, action):
        """Обновляет статистику"""
        try:
            stats = self.load_statistics()
            today = datetime.now().strftime('%Y-%m-%d')
            
            # Сбрасываем дневную статистику если новый день
            if stats['last_reset_date'] != today:
                stats['parsed_today'] = 0
                stats['published_today'] = 0
                stats['rejected_today'] = 0
                stats['last_reset_date'] = today
            
            if action == 'published':
                stats['published_today'] += 1
                stats['total_published'] += 1
            elif action == 'rejected':
                stats['rejected_today'] += 1
                stats['total_rejected'] += 1
            
            # Сохраняем статистику
            stats_file = os.path.join(self.data_dir, 'statistics.json')
            with open(stats_file, 'w', encoding='utf-8') as f:
                json.dump(stats, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            logger.error(f"Ошибка при обновлении статистики: {e}")

# Создаем экземпляр админки
admin = AdminPanel()

@app.route('/')
def dashboard():
    """Главная страница дашборда"""
    stats = admin.load_statistics()
    pending_news = admin.load_pending_news()
    published_news = admin.load_published_news()
    
    # Последние опубликованные новости
    recent_published = published_news[-10:] if published_news else []
    
    return render_template('dashboard.html', 
                         stats=stats,
                         pending_news=pending_news,
                         recent_published=recent_published,
                         bot_running=admin.bot_running)

@app.route('/news')
def news_management():
    """Управление новостями"""
    pending_news = admin.load_pending_news()
    published_news = admin.load_published_news()
    
    return render_template('news.html',
                         pending_news=pending_news,
                         published_news=published_news)

@app.route('/api/approve/<int:news_id>', methods=['POST'])
def approve_news_api(news_id):
    """API для одобрения новости"""
    if admin.approve_news(news_id):
        return jsonify({'status': 'success', 'message': 'Новость одобрена'})
    else:
        return jsonify({'status': 'error', 'message': 'Ошибка при одобрении'}), 500

@app.route('/api/reject/<int:news_id>', methods=['POST'])
def reject_news_api(news_id):
    """API для отклонения новости"""
    if admin.reject_news(news_id):
        return jsonify({'status': 'success', 'message': 'Новость отклонена'})
    else:
        return jsonify({'status': 'error', 'message': 'Ошибка при отклонении'}), 500

@app.route('/api/stats')
def get_stats():
    """API для получения статистики"""
    stats = admin.load_statistics()
    pending_news = admin.load_pending_news()
    published_news = admin.load_published_news()
    
    return jsonify({
        'stats': stats,
        'pending_count': len(pending_news),
        'published_count': len(published_news),
        'bot_running': admin.bot_running
    })

@app.route('/api/start_bot', methods=['POST'])
def start_bot():
    """Запуск бота"""
    if not admin.bot_running:
        # Здесь можно добавить логику запуска бота
        admin.bot_running = True
        return jsonify({'status': 'success', 'message': 'Бот запущен'})
    else:
        return jsonify({'status': 'error', 'message': 'Бот уже запущен'})

@app.route('/api/stop_bot', methods=['POST'])
def stop_bot():
    """Остановка бота"""
    if admin.bot_running:
        admin.bot_running = False
        return jsonify({'status': 'success', 'message': 'Бот остановлен'})
    else:
        return jsonify({'status': 'error', 'message': 'Бот не запущен'})

@socketio.on('connect')
def handle_connect():
    """Обработка подключения WebSocket"""
    emit('status', {'message': 'Подключено к админке'})

@socketio.on('disconnect')
def handle_disconnect():
    """Обработка отключения WebSocket"""
    logger.info('Клиент отключился')

if __name__ == '__main__':
    # Создаем папку data если не существует
    os.makedirs('data', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    
    print("🚀 Запуск веб-админки...")
    print("📊 Дашборд: http://localhost:5000")
    print("📰 Управление новостями: http://localhost:5000/news")
    
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
