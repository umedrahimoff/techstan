const https = require('https');

// Специализированный парсер для Blue Screen
async function parseBlueScreen() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Парсинг Blue Screen...');
    
    const url = 'https://bluescreen.kz/';
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const news = extractBlueScreenNews(data);
          console.log(`✅ Blue Screen: найдено ${news.length} новостей`);
          resolve(news);
        } catch (error) {
          console.error('Ошибка парсинга Blue Screen:', error);
          resolve([]);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Ошибка запроса к Blue Screen:', error);
      resolve([]);
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

// Извлечение новостей из Blue Screen
function extractBlueScreenNews(html) {
  const news = [];
  
  try {
    // Blue Screen специфичные селекторы
    const articleSelectors = [
      '.post',
      '.article',
      '.news-item',
      '.content-item',
      '.entry',
      '.blog-post',
      '.news-card'
    ];
    
    for (const selector of articleSelectors) {
      const regex = new RegExp(`<[^>]*class=["'][^"']*${selector}[^"']*["'][^>]*>(.*?)</[^>]*>`, 'gis');
      let match;
      
      while ((match = regex.exec(html)) !== null) {
        const articleHtml = match[0];
        const newsItem = extractNewsFromBlueScreenArticle(articleHtml);
        
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
            link: 'https://bluescreen.kz/',
            source: 'Blue Screen',
            timestamp: new Date().toISOString(),
            description: ''
          });
        }
      }
    }
    
    // Ограничиваем количество новостей
    return news.slice(0, 10);
    
  } catch (error) {
    console.error('Ошибка извлечения новостей Blue Screen:', error);
    return [];
  }
}

// Извлечение данных из статьи Blue Screen
function extractNewsFromBlueScreenArticle(articleHtml) {
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
                     articleHtml.match(/<div[^>]*class=["'][^"']*excerpt[^"']*["'][^>]*>([^<]+)<\/div>/i) ||
                     articleHtml.match(/<div[^>]*class=["'][^"']*summary[^"']*["'][^>]*>([^<]+)<\/div>/i) ||
                     articleHtml.match(/<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([^<]+)<\/div>/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Извлекаем дату
    const dateMatch = articleHtml.match(/<time[^>]*>([^<]+)<\/time>/i) ||
                     articleHtml.match(/<span[^>]*class=["'][^"']*date[^"']*["'][^>]*>([^<]+)<\/span>/i) ||
                     articleHtml.match(/<div[^>]*class=["'][^"']*published[^"']*["'][^>]*>([^<]+)<\/div>/i) ||
                     articleHtml.match(/<div[^>]*class=["'][^"']*time[^"']*["'][^>]*>([^<]+)<\/div>/i);
    const date = dateMatch ? dateMatch[1].trim() : '';
    
    return {
      title: title,
      link: link || 'https://bluescreen.kz/',
      source: 'Blue Screen',
      timestamp: new Date().toISOString(),
      description: description,
      date: date
    };
    
  } catch (error) {
    console.error('Ошибка извлечения данных статьи Blue Screen:', error);
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
    'казахстан', 'kazakhstan', 'алматы', 'almaty', 'нур-султан', 'nur-sultan',
    'blue screen', 'блог', 'blog'
  ];
  
  const titleLower = title.toLowerCase();
  return techKeywords.some(keyword => titleLower.includes(keyword.toLowerCase()));
}

exports.handler = async (event, context) => {
  try {
    console.log('🔍 Запуск парсера Blue Screen');
    
    const news = await parseBlueScreen();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Blue Screen parsing completed',
        timestamp: new Date().toISOString(),
        source: 'Blue Screen',
        news_count: news.length,
        news: news
      })
    };
    
  } catch (error) {
    console.error('Error parsing Blue Screen:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to parse Blue Screen',
        message: error.message
      })
    };
  }
};
