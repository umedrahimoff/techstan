const https = require('https');

// Специализированный парсер для Spot.uz
async function parseSpotUz() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Парсинг Spot.uz...');
    
    const url = 'https://spot.uz/';
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const news = extractSpotUzNews(data);
          console.log(`✅ Spot.uz: найдено ${news.length} новостей`);
          resolve(news);
        } catch (error) {
          console.error('Ошибка парсинга Spot.uz:', error);
          resolve([]);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Ошибка запроса к Spot.uz:', error);
      resolve([]);
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

// Извлечение новостей из Spot.uz
function extractSpotUzNews(html) {
  const news = [];
  
  try {
    // Spot.uz специфичные селекторы
    const articleSelectors = [
      '.news-item',
      '.article-item',
      '.post-item',
      '.content-item',
      '.news-card',
      '.article-card'
    ];
    
    for (const selector of articleSelectors) {
      const regex = new RegExp(`<[^>]*class=["'][^"']*${selector}[^"']*["'][^>]*>(.*?)</[^>]*>`, 'gis');
      let match;
      
      while ((match = regex.exec(html)) !== null) {
        const articleHtml = match[0];
        const newsItem = extractNewsFromSpotArticle(articleHtml);
        
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
            link: 'https://spot.uz/',
            source: 'Spot.uz',
            timestamp: new Date().toISOString(),
            description: ''
          });
        }
      }
    }
    
    // Ограничиваем количество новостей
    return news.slice(0, 10);
    
  } catch (error) {
    console.error('Ошибка извлечения новостей Spot.uz:', error);
    return [];
  }
}

// Извлечение данных из статьи Spot.uz
function extractNewsFromSpotArticle(articleHtml) {
  try {
    // Извлекаем заголовок
    const titleMatch = articleHtml.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i) ||
                      articleHtml.match(/<a[^>]*>([^<]+)<\/a>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    if (!title || title.length < 10) return null;
    
    // Извлекаем ссылку
    const linkMatch = articleHtml.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/i);
    const link = linkMatch ? linkMatch[1] : '';
    
    // Извлекаем описание
    const descMatch = articleHtml.match(/<p[^>]*>([^<]+)<\/p>/i) ||
                     articleHtml.match(/<div[^>]*class=["'][^"']*desc[^"']*["'][^>]*>([^<]+)<\/div>/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Извлекаем дату
    const dateMatch = articleHtml.match(/<time[^>]*>([^<]+)<\/time>/i) ||
                     articleHtml.match(/<span[^>]*class=["'][^"']*date[^"']*["'][^>]*>([^<]+)<\/span>/i) ||
                     articleHtml.match(/<div[^>]*class=["'][^"']*time[^"']*["'][^>]*>([^<]+)<\/div>/i);
    const date = dateMatch ? dateMatch[1].trim() : '';
    
    return {
      title: title,
      link: link || 'https://spot.uz/',
      source: 'Spot.uz',
      timestamp: new Date().toISOString(),
      description: description,
      date: date
    };
    
  } catch (error) {
    console.error('Ошибка извлечения данных статьи Spot.uz:', error);
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
    'цифровизация', 'digitalization', 'цифровая трансформация', 'digital transformation',
    'узбекистан', 'uzbekistan', 'ташкент', 'tashkent'
  ];
  
  const titleLower = title.toLowerCase();
  return techKeywords.some(keyword => titleLower.includes(keyword.toLowerCase()));
}

exports.handler = async (event, context) => {
  try {
    console.log('🔍 Запуск парсера Spot.uz');
    
    const news = await parseSpotUz();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Spot.uz parsing completed',
        timestamp: new Date().toISOString(),
        source: 'Spot.uz',
        news_count: news.length,
        news: news
      })
    };
    
  } catch (error) {
    console.error('Error parsing Spot.uz:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to parse Spot.uz',
        message: error.message
      })
    };
  }
};
