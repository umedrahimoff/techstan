# Инструкции для пуша в GitHub

## Вариант 1: Через GitHub CLI (рекомендуется)

```bash
# Установите GitHub CLI
brew install gh

# Авторизуйтесь
gh auth login

# Создайте репозиторий и запушьте
gh repo create umedrahimoff/techstan --public --source=. --remote=origin --push
```

## Вариант 2: Через Personal Access Token

```bash
# Создайте Personal Access Token на https://github.com/settings/tokens
# Выберите scopes: repo, workflow

# Запушьте с токеном
git push https://YOUR_TOKEN@github.com/umedrahimoff/techstan.git main
```

## Вариант 3: Через SSH ключи

```bash
# Сгенерируйте SSH ключ
ssh-keygen -t ed25519 -C "your_email@example.com"

# Добавьте ключ в GitHub Settings > SSH Keys
cat ~/.ssh/id_ed25519.pub

# Измените remote URL
git remote set-url origin git@github.com:umedrahimoff/techstan.git

# Запушьте
git push -u origin main
```

## Вариант 4: Ручная загрузка

1. Создайте репозиторий на https://github.com/new
2. Название: `techstan`
3. Сделайте публичным
4. Загрузите файлы через веб-интерфейс

## Готовые файлы для загрузки:

Все файлы готовы в папке проекта:
- `src/` - исходный код
- `config.py` - конфигурация
- `requirements.txt` - зависимости
- `README.md` - документация
- `run.py` - скрипт запуска
- `.gitignore` - исключения

**Секретные данные (.env, data/, logs/) исключены!**
