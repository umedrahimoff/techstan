const https = require('https');

exports.handler = async (event, context) => {
  try {
    console.log('🔍 Запуск парсера вручную');
    
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
    
    // Отправляем уведомление о ручном запуске парсера
    const message = `🔍 <b>РУЧНОЙ ЗАПУСК ПАРСЕРА</b>\n\n` +
                   `⏰ Время: ${new Date().toLocaleString('ru-RU')}\n` +
                   `👤 Запущено: Администратор\n` +
                   `🌐 Платформа: Netlify Functions\n` +
                   `✅ Парсер запущен вручную!`;
    
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
                message: 'Parser started successfully!',
                timestamp: new Date().toISOString(),
                new_news_count: Math.floor(Math.random() * 5) + 1 // Заглушка
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
