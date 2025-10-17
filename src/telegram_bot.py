import asyncio
import json
import os
import logging
from datetime import datetime
from typing import List, Dict
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from telegram.error import TelegramError
from news_parser import NewsParser
from config import BOT_TOKEN, MODERATION_GROUP_ID, CHANNEL_ID, CHECK_INTERVAL

# Настройка логирования
logger = logging.getLogger(__name__)

class TelegramNewsBot:
    def __init__(self):
        self.bot = Bot(token=BOT_TOKEN)
        self.news_parser = NewsParser()
        self.data_dir = 'data'
        self.pending_news_file = os.path.join(self.data_dir, 'pending_news.json')
        self.published_news_file = os.path.join(self.data_dir, 'published_news.json')
        self.statistics_file = os.path.join(self.data_dir, 'statistics.json')
        
        # Создаем папку data если не существует
        os.makedirs(self.data_dir, exist_ok=True)
        
    def load_pending_news(self) -> List[Dict]:
        """Загружает список новостей на модерации"""
        if os.path.exists(self.pending_news_file):
            try:
                with open(self.pending_news_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Ошибка при загрузке pending_news: {e}")
                return []
        return []
    
    def save_pending_news(self, news_list: List[Dict]):
        """Сохраняет список новостей на модерации"""
        try:
            with open(self.pending_news_file, 'w', encoding='utf-8') as f:
                json.dump(news_list, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Ошибка при сохранении pending_news: {e}")
    
    def load_published_news(self) -> List[Dict]:
        """Загружает список уже опубликованных новостей"""
        if os.path.exists(self.published_news_file):
            try:
                with open(self.published_news_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Обрабатываем как старые записи (строки), так и новые (объекты)
                    result = []
                    for item in data:
                        if isinstance(item, str):
                            # Старый формат - только ссылка
                            result.append({'link': item})
                        elif isinstance(item, dict):
                            # Новый формат - полный объект
                            result.append(item)
                    return result
            except Exception as e:
                logger.error(f"Ошибка при загрузке published_news: {e}")
                return []
        else:
            # Создаем файл если не существует
            self.save_published_news([])
            return []
    
    def save_published_news(self, published_news: List[Dict]):
        """Сохраняет список опубликованных новостей"""
        try:
            with open(self.published_news_file, 'w', encoding='utf-8') as f:
                json.dump(published_news, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Ошибка при сохранении published_news: {e}")
    
    def load_statistics(self) -> Dict:
        """Загружает статистику"""
        if os.path.exists(self.statistics_file):
            try:
                with open(self.statistics_file, 'r', encoding='utf-8') as f:
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
    
    def save_statistics(self, stats: Dict):
        """Сохраняет статистику"""
        try:
            with open(self.statistics_file, 'w', encoding='utf-8') as f:
                json.dump(stats, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Ошибка при сохранении статистики: {e}")
    
    def update_statistics(self, action: str, count: int = 1):
        """Обновляет статистику"""
        stats = self.load_statistics()
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Сбрасываем дневную статистику если новый день
        if stats['last_reset_date'] != today:
            stats['parsed_today'] = 0
            stats['published_today'] = 0
            stats['rejected_today'] = 0
            stats['last_reset_date'] = today
        
        if action == 'parsed':
            stats['parsed_today'] += count
            stats['total_parsed'] += count
        elif action == 'published':
            stats['published_today'] += count
            stats['total_published'] += count
        elif action == 'rejected':
            stats['rejected_today'] += count
            stats['total_rejected'] += count
        
        self.save_statistics(stats)
    
    def get_processed_links(self) -> set:
        """Получает множество уже обработанных ссылок"""
        processed_links = set()
        
        # Добавляем ссылки из pending_news
        for news in self.load_pending_news():
            if 'link' in news:
                processed_links.add(news['link'])
        
        # Добавляем ссылки из published_news
        for news in self.load_published_news():
            if isinstance(news, dict) and 'link' in news:
                processed_links.add(news['link'])
        
        return processed_links
    
    async def generate_report(self, period_hours: int = 24) -> str:
        """Генерирует отчет за указанный период"""
        stats = self.load_statistics()
        published_news = self.load_published_news()
        
        # Получаем время начала периода
        from datetime import timedelta
        now = datetime.now()
        period_start = now - timedelta(hours=period_hours)
        
        # Фильтруем опубликованные новости за период (если есть timestamp)
        recent_published = []
        try:
            for news in published_news:
                if isinstance(news, dict) and 'timestamp' in news:
                    news_time = datetime.fromisoformat(news['timestamp'])
                    if news_time >= period_start:
                        recent_published.append(news)
        except:
            # Если нет timestamp, показываем все
            recent_published = published_news[-10:]  # Последние 10
        
        report = f"<b>ОТЧЕТ ЗА ПОСЛЕДНИЕ {period_hours} ЧАСОВ</b>\n\n"
        report += f"<b>Спарсено новостей:</b> {stats['parsed_today']}\n"
        report += f"<b>Опубликовано:</b> {stats['published_today']}\n"
        report += f"<b>Отклонено:</b> {stats['rejected_today']}\n\n"
        
        report += f"<b>ОБЩАЯ СТАТИСТИКА:</b>\n"
        report += f"Всего спарсено: {stats['total_parsed']}\n"
        report += f"Всего опубликовано: {stats['total_published']}\n"
        report += f"Всего отклонено: {stats['total_rejected']}\n\n"
        
        if recent_published:
            report += f"<b>ПОСЛЕДНИЕ ОПУБЛИКОВАННЫЕ НОВОСТИ:</b>\n"
            for i, news in enumerate(recent_published[-5:], 1):  # Последние 5
                if isinstance(news, dict):
                    title = news.get('title', 'Без заголовка')
                    link = news.get('link', '')
                    report += f"{i}. {title}\n"
                    if link:
                        report += f"   {link}\n"
                else:
                    report += f"{i}. {news}\n"
                report += "\n"
        
        return report
    
    async def check_for_new_news(self):
        """Проверяет новые новости и отправляет на модерацию"""
        try:
            logger.info("Проверяем новые новости...")
            all_news = self.news_parser.get_all_news()
            processed_links = self.get_processed_links()
            
            new_news = []
            for news in all_news:
                if news['link'] not in processed_links:
                    new_news.append(news)
                else:
                    logger.debug(f"ДУБЛЬ: {news['title']}")
            
            if new_news:
                logger.info(f"Найдено {len(new_news)} новых новостей")
                await self.send_news_for_moderation(new_news)
                self.update_statistics('parsed', len(new_news))
            else:
                logger.info("Новых новостей не найдено")
                
        except Exception as e:
            logger.error(f"Ошибка при проверке новостей: {e}")
    
    async def send_news_for_moderation(self, news_list: List[Dict]):
        """Отправляет новости на модерацию в группу"""
        try:
            pending_news = self.load_pending_news()
            processed_links = self.get_processed_links()
            
            new_news_count = 0
            
            for news in news_list:
                if news['link'] in processed_links:
                    logger.debug(f"ДУБЛЬ: {news['title']}")
                    continue
                
                # Создаем клавиатуру с кнопками одобрения/отклонения
                keyboard = [
                    [
                        InlineKeyboardButton("Одобрить", callback_data=f"approve_{len(pending_news)}"),
                        InlineKeyboardButton("Отклонить", callback_data=f"reject_{len(pending_news)}")
                    ]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                # Формируем сообщение
                message_text = f"<b>Новая новость для модерации:</b>\n\n"
                message_text += f"<b>Заголовок:</b> {news['title']}\n"
                message_text += f"<b>Источник:</b> {news['source']}\n"
                message_text += f"<b>Ссылка:</b> {news['link']}\n\n"
                message_text += f"<b>Канал:</b> {CHANNEL_ID}"
                
                # Отправляем в группу модерации
                await self.bot.send_message(
                    chat_id=MODERATION_GROUP_ID,
                    text=message_text,
                    parse_mode='HTML',
                    reply_markup=reply_markup
                )
                
                # Добавляем в список ожидающих модерации
                news['id'] = len(pending_news)
                news['timestamp'] = datetime.now().isoformat()
                pending_news.append(news)
                new_news_count += 1
                
                # Добавляем ссылку в список обработанных
                processed_links.add(news['link'])
            
            self.save_pending_news(pending_news)
            logger.info(f"Отправлено {new_news_count} новых новостей на модерацию")
            
        except TelegramError as e:
            logger.error(f"Ошибка при отправке на модерацию: {e}")
    
    async def handle_callback_query(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обрабатывает нажатия на кнопки модерации"""
        query = update.callback_query
        await query.answer()
        
        try:
            action, news_id = query.data.split('_', 1)
            news_id = int(news_id)
            
            pending_news = self.load_pending_news()
            
            # Находим новость по ID
            news_to_process = None
            for i, news in enumerate(pending_news):
                if news.get('id') == news_id:
                    news_to_process = news
                    break
            
            if not news_to_process:
                await query.edit_message_text("❌ Новость не найдена")
                return
            
            if action == "approve":
                # Одобряем новость
                await self.publish_news(news_to_process)
                
                # Удаляем из списка ожидающих
                pending_news = [news for news in pending_news if news.get('id') != news_id]
                self.save_pending_news(pending_news)
                
                # Добавляем новость в список опубликованных
                news_to_process['timestamp'] = datetime.now().isoformat()
                published_news = self.load_published_news()
                published_news.append(news_to_process)
                self.save_published_news(published_news)
                
                # Обновляем статистику
                self.update_statistics('published')
                
                await query.edit_message_text("✅ Новость одобрена и опубликована!")
                
            elif action == "reject":
                # Отклоняем новость
                pending_news = [news for news in pending_news if news.get('id') != news_id]
                self.save_pending_news(pending_news)
                
                # Обновляем статистику
                self.update_statistics('rejected')
                
                await query.edit_message_text("❌ Новость отклонена")
                
        except Exception as e:
            logger.error(f"Ошибка при обработке callback: {e}")
            await query.edit_message_text("Произошла ошибка")
    
    async def publish_news(self, news: Dict):
        """Публикует новость в канал"""
        try:
            # Создаем короткую ссылку для отображения
            short_link = self.get_short_link(news['link'])
            
            # Создаем полную ссылку с UTM-метками для перенаправления
            utm_link = self.add_utm_params(news['link'])
            
            # Создаем кликабельную ссылку только для домена
            clickable_link = f"[{short_link}]({utm_link})"
            
            message_text = f"{news['title']}\n\n"
            message_text += f"Читать: {clickable_link}\n\n"
            message_text += f"{CHANNEL_ID}"
            
            # Отправляем сообщение с кликабельной ссылкой
            await self.bot.send_message(
                chat_id=CHANNEL_ID,
                text=message_text,
                parse_mode='Markdown'
            )
            
            logger.info(f"Опубликована новость: {news['title']}")
            
        except TelegramError as e:
            logger.error(f"Ошибка при публикации в канал: {e}")
    
    def add_utm_params(self, url: str) -> str:
        """Добавляет UTM-параметры к ссылке для отслеживания трафика"""
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
        
        try:
            parsed = urlparse(url)
            query_params = parse_qs(parsed.query)
            
            # Добавляем UTM-метки
            query_params['utm_source'] = ['telegram']
            query_params['utm_medium'] = ['social']
            query_params['utm_campaign'] = ['techstan_news']
            query_params['utm_content'] = ['news_post']
            
            # Собираем URL обратно
            new_query = urlencode(query_params, doseq=True)
            new_parsed = parsed._replace(query=new_query)
            
            return urlunparse(new_parsed)
            
        except Exception as e:
            logger.error(f"Ошибка при добавлении UTM-параметров: {e}")
            return url
    
    def get_short_link(self, url: str) -> str:
        """Возвращает короткую ссылку для отображения в канале"""
        from urllib.parse import urlparse
        
        try:
            parsed = urlparse(url)
            
            # Определяем короткую ссылку по домену
            if 'digitalbusiness.kz' in parsed.netloc:
                return 'https://digitalbusiness.kz/'
            elif 'spot.uz' in parsed.netloc:
                return 'https://spot.uz/'
            elif 'the-tech.kz' in parsed.netloc:
                return 'https://the-tech.kz/'
            elif 'bluescreen.kz' in parsed.netloc:
                return 'https://bluescreen.kz/'
            else:
                # Для других доменов показываем базовый домен
                return f"https://{parsed.netloc}/"
                
        except Exception as e:
            logger.error(f"Ошибка при создании короткой ссылки: {e}")
            return url
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /start"""
        await update.message.reply_text(
            "Бот для мониторинга технологических новостей запущен!\n\n"
            "Бот автоматически проверяет новости и отправляет их на модерацию."
        )
    
    async def status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /status"""
        pending_news = self.load_pending_news()
        published_links = self.load_published_news()
        
        status_text = f"Статус бота:\n\n"
        status_text += f"На модерации: {len(pending_news)}\n"
        status_text += f"Опубликовано: {len(published_links)}\n"
        status_text += f"Проверка каждые {CHECK_INTERVAL} минут"
        
        await update.message.reply_text(status_text)
    
    async def report_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /report"""
        try:
            # Получаем период из аргументов команды (по умолчанию 24 часа)
            period_hours = 24
            if context.args and context.args[0].isdigit():
                period_hours = int(context.args[0])
            
            report = await self.generate_report(period_hours)
            await update.message.reply_text(report, parse_mode='HTML')
        except Exception as e:
            logger.error(f"Ошибка при генерации отчета: {e}")
            await update.message.reply_text(f"Ошибка при генерации отчета: {e}")
    
    async def send_daily_report(self):
        """Отправляет ежедневный отчет в группу модерации"""
        try:
            report = await self.generate_report(24)
            await self.bot.send_message(
                chat_id=MODERATION_GROUP_ID,
                text=report,
                parse_mode='HTML'
            )
            logger.info("Ежедневный отчет отправлен")
        except Exception as e:
            logger.error(f"Ошибка при отправке ежедневного отчета: {e}")
    
    async def periodic_check(self):
        """Периодическая проверка новостей"""
        while True:
            try:
                await self.check_for_new_news()
                await asyncio.sleep(CHECK_INTERVAL * 60)  # Конвертируем минуты в секунды
            except Exception as e:
                logger.error(f"Ошибка в периодической проверке: {e}")
                await asyncio.sleep(60)  # Ждем минуту перед повтором
    
    def run(self):
        """Запускает бота"""
        try:
            application = Application.builder().token(BOT_TOKEN).build()
            
            # Добавляем обработчики команд
            application.add_handler(CommandHandler("start", self.start_command))
            application.add_handler(CommandHandler("status", self.status_command))
            application.add_handler(CommandHandler("report", self.report_command))
            application.add_handler(CallbackQueryHandler(self.handle_callback_query))
            
            # Запускаем периодическую проверку новостей
            application.job_queue.run_repeating(
                lambda context: asyncio.create_task(self.check_for_new_news()),
                interval=CHECK_INTERVAL * 60,
                first=10  # Первая проверка через 10 секунд
            )
            
            # Запускаем бота
            logger.info("Запускаем бота...")
            application.run_polling()
            
        except Exception as e:
            logger.error(f"Критическая ошибка при запуске бота: {e}")
            raise

if __name__ == "__main__":
    bot = TelegramNewsBot()
    bot.run()
