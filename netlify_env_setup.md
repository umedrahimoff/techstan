# Настройка переменных окружения в Netlify

## Автоматический способ (рекомендуется)

1. **Установите зависимости:**
```bash
pip install netlify-py
```

2. **Получите токен Netlify:**
   - Перейдите: https://app.netlify.com/user/applications#personal-access-tokens
   - Создайте новый токен
   - Скопируйте токен

3. **Найдите ID сайта:**
   - В панели Netlify → Site settings → General
   - Скопируйте "Site ID"

4. **Запустите скрипт:**
```bash
export NETLIFY_TOKEN='your_token_here'
export NETLIFY_SITE_ID='your_site_id_here'
python setup_netlify.py
```

## Ручной способ

1. **Зайдите в панель Netlify:**
   - Откройте ваш проект
   - Перейдите в `Site settings` → `Environment variables`

2. **Добавьте переменные:**
   ```
   BOT_TOKEN = 8439861011:AAFGHb2RionJTnAGINhCtBxoqVu7fk8rZ3g
   MODERATION_GROUP_ID = -4877957523
   CHANNEL_ID = @techstannews
   CHECK_INTERVAL = 30
   ```

3. **Сохраните изменения**

## Проверка

После настройки переменных:
1. Задеплойте проект (git push)
2. Проверьте логи в Netlify Functions
3. Убедитесь, что бот запустился без ошибок
