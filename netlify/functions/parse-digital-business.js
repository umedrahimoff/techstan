const https = require('https');

// Специализированный парсер для Digital Business
async function parseDigitalBusiness() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Парсинг Digital Business...');
    
    const url = 'https://digitalbusiness.kz/';
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const news = extractDigitalBusinessNews(data);
          console.log(`✅ Digital Business: найдено ${news.length} новостей`);
          resolve(news);
        } catch (error) {
          console.error('Ошибка парсинга Digital Business:', error);
          resolve([]);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Ошибка запроса к Digital Business:', error);
      resolve([]);
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

// Извлечение новостей из Digital Business
function extractDigitalBusinessNews(html) {
  const news = [];
  
  try {
    // Ищем статьи по различным селекторам
    const articleSelectors = [
      // Основные селекторы для статей
      'article',
      '.post',
      '.news-item',
      '.article-item',
      '.content-item',
      '.entry'
    ];
    
    for (const selector of articleSelectors) {
      const regex = new RegExp(`<${selector}[^>]*>(.*?)</${selector}>`, 'gis');
      let match;
      
      while ((match = regex.exec(html)) !== null) {
        const articleHtml = match[1];
        const newsItem = extractNewsFromArticle(articleHtml, 'Digital Business');
        
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
            link: 'https://digitalbusiness.kz/',
            source: 'Digital Business',
            timestamp: new Date().toISOString(),
            description: ''
          });
        }
      }
    }
    
    // Ограничиваем количество новостей
    return news.slice(0, 10);
    
  } catch (error) {
    console.error('Ошибка извлечения новостей Digital Business:', error);
    return [];
  }
}

// Извлечение данных из отдельной статьи
function extractNewsFromArticle(articleHtml, source) {
  try {
    // Извлекаем заголовок
    const titleMatch = articleHtml.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    if (!title || title.length < 10) return null;
    
    // Извлекаем ссылку
    const linkMatch = articleHtml.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/i);
    const link = linkMatch ? linkMatch[1] : '';
    
    // Извлекаем описание
    const descMatch = articleHtml.match(/<p[^>]*>([^<]+)<\/p>/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Извлекаем дату
    const dateMatch = articleHtml.match(/<time[^>]*>([^<]+)<\/time>/i) || 
                     articleHtml.match(/<span[^>]*class=["'][^"']*date[^"']*["'][^>]*>([^<]+)<\/span>/i);
    const date = dateMatch ? dateMatch[1].trim() : '';
    
    return {
      title: title,
      link: link || 'https://digitalbusiness.kz/',
      source: source,
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
    console.log('🔍 Запуск парсера Digital Business');
    
    const news = await parseDigitalBusiness();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Digital Business parsing completed',
        timestamp: new Date().toISOString(),
        source: 'Digital Business',
        news_count: news.length,
        news: news
      })
    };
    
  } catch (error) {
    console.error('Error parsing Digital Business:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to parse Digital Business',
        message: error.message
      })
    };
  }
};
