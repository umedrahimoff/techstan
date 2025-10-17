const https = require('https');

// Интегрированный умный парсер для всех источников
async function parseAllSources() {
  console.log('🔍 Запуск умного парсера для всех источников');
  
  const sources = [
    { name: 'Digital Business', url: 'https://digitalbusiness.kz/', parser: 'parse-digital-business' },
    { name: 'Spot.uz', url: 'https://spot.uz/', parser: 'parse-spot' },
    { name: 'The Tech', url: 'https://the-tech.kz/', parser: 'parse-the-tech' },
    { name: 'Blue Screen', url: 'https://bluescreen.kz/', parser: 'parse-bluescreen' }
  ];
  
  const allNews = [];
  const results = [];
  
  for (const source of sources) {
    try {
      console.log(`📰 Парсинг ${source.name}...`);
      
      // Вызываем специализированный парсер для каждого источника
      const news = await parseSource(source);
      
      results.push({
        source: source.name,
        url: source.url,
        news_count: news.length,
        success: true,
        news: news
      });
      
      allNews.push(...news);
      
    } catch (error) {
      console.error(`❌ Ошибка парсинга ${source.name}:`, error);
      
      results.push({
        source: source.name,
        url: source.url,
        news_count: 0,
        success: false,
        error: error.message,
        news: []
      });
    }
  }
  
  return {
    total_news: allNews.length,
    sources_parsed: results.length,
    sources_successful: results.filter(r => r.success).length,
    all_news: allNews,
    results: results
  };
}

// Парсинг отдельного источника
async function parseSource(source) {
  return new Promise((resolve, reject) => {
    const req = https.get(source.url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const news = extractNewsFromSource(data, source.name, source.url);
          resolve(news);
        } catch (error) {
          console.error(`Ошибка извлечения новостей из ${source.name}:`, error);
          resolve([]);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Ошибка запроса к ${source.name}:`, error);
      resolve([]);
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

// Извлечение новостей из источника с учетом его специфики
function extractNewsFromSource(html, sourceName, sourceUrl) {
  const news = [];
  
  try {
    // Определяем специфичные селекторы для каждого источника
    const selectors = getSourceSelectors(sourceName);
    
    // Ищем статьи по селекторам
    for (const selector of selectors.articles) {
      const regex = new RegExp(`<[^>]*class=["'][^"']*${selector}[^"']*["'][^>]*>(.*?)</[^>]*>`, 'gis');
      let match;
      
      while ((match = regex.exec(html)) !== null) {
        const articleHtml = match[0];
        const newsItem = extractNewsFromArticle(articleHtml, sourceName, sourceUrl);
        
        if (newsItem && newsItem.title && newsItem.title.length > 10) {
          news.push(newsItem);
        }
      }
    }
    
    // Если не нашли через селекторы, ищем по заголовкам
    if (news.length === 0) {
      const titleRegex = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
      let titleMatch;
      
      while ((titleMatch = titleRegex.exec(html)) !== null) {
        const title = titleMatch[1].trim();
        
        if (isTechNews(title) && title.length > 10 && title.length < 200) {
          news.push({
            title: title,
            link: sourceUrl,
            source: sourceName,
            timestamp: new Date().toISOString(),
            description: ''
          });
        }
      }
    }
    
    // Ограничиваем количество новостей
    return news.slice(0, 5);
    
  } catch (error) {
    console.error(`Ошибка извлечения новостей из ${sourceName}:`, error);
    return [];
  }
}

// Получение специфичных селекторов для источника
function getSourceSelectors(sourceName) {
  const selectors = {
    'Digital Business': {
      articles: ['post', 'article', 'news-item', 'content-item', 'entry'],
      titles: ['h1', 'h2', 'h3', '.title', '.headline'],
      links: ['a'],
      dates: ['.date', '.time', '.published', 'time']
    },
    'Spot.uz': {
      articles: ['news-item', 'article-item', 'post-item', 'content-item', 'news-card'],
      titles: ['h1', 'h2', 'h3', '.title', '.headline'],
      links: ['a'],
      dates: ['.date', '.time', '.published', 'time']
    },
    'The Tech': {
      articles: ['post', 'article', 'news-item', 'content-item', 'entry', 'blog-post'],
      titles: ['h1', 'h2', 'h3', '.title', '.headline'],
      links: ['a'],
      dates: ['.date', '.time', '.published', 'time']
    },
    'Blue Screen': {
      articles: ['post', 'article', 'news-item', 'content-item', 'entry', 'blog-post', 'news-card'],
      titles: ['h1', 'h2', 'h3', '.title', '.headline'],
      links: ['a'],
      dates: ['.date', '.time', '.published', 'time']
    }
  };
  
  return selectors[sourceName] || selectors['Digital Business'];
}

// Извлечение данных из статьи
function extractNewsFromArticle(articleHtml, sourceName, sourceUrl) {
  try {
    // Извлекаем заголовок
    const titleMatch = articleHtml.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i) ||
                      articleHtml.match(/<a[^>]*>([^<]+)<\/a>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    if (!title || title.length < 10) return null;
    
    // Извлекаем ссылку
    const linkMatch = articleHtml.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/i);
    const link = linkMatch ? linkMatch[1] : sourceUrl;
    
    // Извлекаем описание
    const descMatch = articleHtml.match(/<p[^>]*>([^<]+)<\/p>/i) ||
                     articleHtml.match(/<div[^>]*class=["'][^"']*excerpt[^"']*["'][^>]*>([^<]+)<\/div>/i) ||
                     articleHtml.match(/<div[^>]*class=["'][^"']*summary[^"']*["'][^>]*>([^<]+)<\/div>/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Извлекаем дату
    const dateMatch = articleHtml.match(/<time[^>]*>([^<]+)<\/time>/i) ||
                     articleHtml.match(/<span[^>]*class=["'][^"']*date[^"']*["'][^>]*>([^<]+)<\/span>/i) ||
                     articleHtml.match(/<div[^>]*class=["'][^"']*published[^"']*["'][^>]*>([^<]+)<\/div>/i);
    const date = dateMatch ? dateMatch[1].trim() : '';
    
    return {
      title: title,
      link: link,
      source: sourceName,
      timestamp: new Date().toISOString(),
      description: description,
      date: date
    };
    
  } catch (error) {
    console.error('Ошибка извлечения данных статьи:', error);
    return null;
  }
}

// Проверка, является ли новость технологической
function isTechNews(title) {
  const techKeywords = [
    'стартап', 'startup', 'инвестиции', 'investment', 'технологии', 'technology',
    'ИИ', 'AI', 'блокчейн', 'blockchain', 'криптовалюта', 'crypto', 'финтех', 'fintech',
    'IT', 'программирование', 'programming', 'разработка', 'development',
    'данные', 'data', 'машинное обучение', 'machine learning', 'автоматизация', 'automation',
    'робот', 'robot', 'инновации', 'innovation', 'интернет вещей', 'IoT',
    'облако', 'cloud', 'кибербезопасность', 'cybersecurity', 'VR', 'AR',
    'мобильное приложение', 'mobile app', 'веб-разработка', 'web development',
    'цифровизация', 'digitalization', 'цифровая трансформация', 'digital transformation'
  ];
  
  const titleLower = title.toLowerCase();
  return techKeywords.some(keyword => titleLower.includes(keyword.toLowerCase()));
}

exports.handler = async (event, context) => {
  try {
    console.log('🔍 Запуск умного парсера');
    
    const result = await parseAllSources();
    
    // Отправляем уведомление в Telegram
    const botToken = process.env.BOT_TOKEN;
    const moderationGroupId = process.env.MODERATION_GROUP_ID;
    
    if (botToken && moderationGroupId) {
      const message = `🔍 <b>УМНЫЙ ПАРСЕР ЗАВЕРШЕН</b>\n\n` +
                     `⏰ Время: ${new Date().toLocaleString('ru-RU')}\n` +
                     `📊 Всего новостей: ${result.total_news}\n` +
                     `✅ Успешных источников: ${result.sources_successful}/${result.sources_parsed}\n` +
                     `🌐 Платформа: Netlify Functions\n` +
                     `✅ Парсинг завершен успешно!`;
      
      try {
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const postData = JSON.stringify({
          chat_id: moderationGroupId,
          text: message,
          parse_mode: 'HTML'
        });
        
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };
        
        const req = https.request(telegramUrl, options);
        req.write(postData);
        req.end();
        
        console.log('Telegram notification sent successfully');
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError);
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Smart parser completed successfully',
        timestamp: new Date().toISOString(),
        total_news: result.total_news,
        sources_parsed: result.sources_parsed,
        sources_successful: result.sources_successful,
        results: result.results,
        all_news: result.all_news
      })
    };
    
  } catch (error) {
    console.error('Error in smart parser:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to run smart parser',
        message: error.message
      })
    };
  }
};
