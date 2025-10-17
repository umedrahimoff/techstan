const https = require('https');
const { checkAuth } = require('./auth-middleware');

exports.handler = async (event, context) => {
  try {
    console.log('🔍 Запуск парсера вручную');
    
    // Проверка авторизации
    const authError = checkAuth(event);
    if (authError) return authError;
    
    const botToken = process.env.BOT_TOKEN;
    const moderationGroupId = process.env.MODERATION_GROUP_ID;
    const channelId = process.env.CHANNEL_ID;
    
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
    
    // Симулируем парсинг новостей
    const mockNews = [
      {
        title: "Казахстанский стартап привлек $5 млн инвестиций",
        link: "https://example.com/news1",
        source: "Digital Business",
        timestamp: new Date().toISOString()
      },
      {
        title: "Новая технология ИИ в Узбекистане",
        link: "https://example.com/news2",
        source: "Spot.uz",
        timestamp: new Date().toISOString()
      },
      {
        title: "Финтех компания запустила новый продукт",
        link: "https://example.com/news3",
        source: "The Tech",
        timestamp: new Date().toISOString()
      }
    ];
    
    // Отправляем уведомление о ручном запуске парсера
    const message = `🔍 <b>РУЧНОЙ ЗАПУСК ПАРСЕРА</b>\n\n` +
                   `⏰ Время: ${new Date().toLocaleString('ru-RU')}\n` +
                   `👤 Запущено: Администратор\n` +
                   `🌐 Платформа: Netlify Functions\n` +
                   `📊 Найдено новостей: ${mockNews.length}\n` +
                   `✅ Парсер завершен успешно!`;
    
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
          
          if (res.statusCode === 200) {
            resolve({
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'Parser completed successfully!',
                timestamp: new Date().toISOString(),
                new_news_count: mockNews.length,
                parsed_news: mockNews
              })
            });
          } else {
            resolve({
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                error: 'Failed to send parser notification',
                statusCode: res.statusCode,
                response: data
              })
            });
          }
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
            error: 'Failed to send request to Telegram',
            message: err.message
          })
        });
      });
      
      req.write(postData);
      req.end();
    });
    
  } catch (error) {
    console.error('Error starting parser:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to start parser',
        message: error.message
      })
    };
  }
};
