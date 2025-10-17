const https = require('https');
const { checkAuth } = require('./auth-middleware');

// Простой парсер новостей на JavaScript
async function parseNewsFromSite(url, sourceName) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Простой парсинг HTML для поиска новостей
          const newsItems = [];
          
          // Ищем заголовки новостей по паттернам
          const titleRegex = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
          const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
          
          let match;
          const titles = [];
          const links = [];
          
          // Извлекаем заголовки
          while ((match = titleRegex.exec(data)) !== null) {
            const title = match[1].trim();
            if (title.length > 10 && title.length < 200) {
              titles.push(title);
            }
          }
          
          // Извлекаем ссылки
          while ((match = linkRegex.exec(data)) !== null) {
            const link = match[1];
            const linkText = match[2].trim();
            if (linkText.length > 10 && linkText.length < 200) {
              links.push({ url: link, text: linkText });
            }
          }
          
          // Создаем новости из найденных заголовков
          titles.slice(0, 5).forEach((title, index) => {
            if (isTechNews(title)) {
              newsItems.push({
                title: title,
                link: links[index] ? links[index].url : url,
                source: sourceName,
                timestamp: new Date().toISOString()
              });
            }
          });
          
          resolve(newsItems);
        } catch (error) {
          console.error('Error parsing HTML:', error);
          resolve([]);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error fetching URL:', error);
      resolve([]);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

// Проверяем, является ли новость технологической
function isTechNews(title) {
  const techKeywords = [
    'стартап', 'startup', 'инвестиции', 'investment', 'технологии', 'technology',
    'ИИ', 'AI', 'блокчейн', 'blockchain', 'криптовалюта', 'crypto', 'финтех', 'fintech',
    'IT', 'программирование', 'programming', 'разработка', 'development',
    'данные', 'data', 'машинное обучение', 'machine learning', 'автоматизация', 'automation',
    'робот', 'robot', 'инновации', 'innovation', 'интернет вещей', 'IoT',
    'облако', 'cloud', 'кибербезопасность', 'cybersecurity', 'VR', 'AR'
  ];
  
  const titleLower = title.toLowerCase();
  return techKeywords.some(keyword => titleLower.includes(keyword.toLowerCase()));
}

exports.handler = async (event, context) => {
  try {
    console.log('🔍 Запуск реального парсера');
    
    // Проверка авторизации
    const authError = checkAuth(event);
    if (authError) return authError;
    
    const botToken = process.env.BOT_TOKEN;
    const moderationGroupId = process.env.MODERATION_GROUP_ID;
    
    if (!botToken) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'BOT_TOKEN not found in environment variables'
        })
      };
    }
    
    // Список источников для парсинга
    const sources = [
      { url: 'https://digitalbusiness.kz/', name: 'Digital Business' },
      { url: 'https://spot.uz/', name: 'Spot.uz' },
      { url: 'https://the-tech.kz/', name: 'The Tech' },
      { url: 'https://bluescreen.kz/', name: 'Blue Screen' }
    ];
    
    let allNews = [];
    
    // Парсим каждый источник
    for (const source of sources) {
      try {
        console.log(`Парсинг ${source.name}...`);
        const news = await parseNewsFromSite(source.url, source.name);
        allNews = allNews.concat(news);
        console.log(`Найдено ${news.length} новостей в ${source.name}`);
      } catch (error) {
        console.error(`Ошибка парсинга ${source.name}:`, error);
      }
    }
    
    // Отправляем уведомление о результатах парсинга
    const message = `🔍 <b>ПАРСИНГ ЗАВЕРШЕН</b>\n\n` +
                   `⏰ Время: ${new Date().toLocaleString('ru-RU')}\n` +
                   `👤 Запущено: Администратор\n` +
                   `🌐 Платформа: Netlify Functions\n` +
                   `📊 Найдено новостей: ${allNews.length}\n` +
                   `✅ Парсинг завершен успешно!`;
    
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
    
    return new Promise((resolve, reject) => {
      const req = https.request(telegramUrl, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('Parser notification sent:', data);
          
          resolve({
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              message: 'Real parser completed successfully!',
              timestamp: new Date().toISOString(),
              new_news_count: allNews.length,
              parsed_news: allNews,
              sources_checked: sources.length
            })
          });
        });
      });
      
      req.on('error', (err) => {
        console.error('Request error:', err);
        reject({
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: 'Failed to send parser notification',
            message: err.message
          })
        });
      });
      
      req.write(postData);
      req.end();
    });
    
  } catch (error) {
    console.error('Error in real parser:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to run real parser',
        message: error.message
      })
    };
  }
};
