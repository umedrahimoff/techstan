const https = require('https');

exports.handler = async (event, context) => {
  try {
    console.log('🚀 Запуск Netlify Function для Telegram бота');
    
    // Проверяем переменные окружения
    const botToken = process.env.BOT_TOKEN;
    const moderationGroupId = process.env.MODERATION_GROUP_ID;
    const channelId = process.env.CHANNEL_ID;
    const checkInterval = process.env.CHECK_INTERVAL || '30';
    
    console.log('Environment variables:');
    console.log('BOT_TOKEN:', botToken ? 'SET' : 'NOT SET');
    console.log('MODERATION_GROUP_ID:', moderationGroupId);
    console.log('CHANNEL_ID:', channelId);
    console.log('CHECK_INTERVAL:', checkInterval);
    
    if (!botToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'BOT_TOKEN not found in environment variables',
          message: 'Проверьте настройки переменных окружения в Netlify'
        })
      };
    }
    
    // Отправляем тестовое сообщение напрямую через Telegram API
    const message = `🧪 ТЕСТОВОЕ СООБЩЕНИЕ ИЗ NETLIFY\n\n` +
                   `⏰ Время: ${new Date().toLocaleString('ru-RU')}\n` +
                   `🌐 Платформа: Netlify Functions\n` +
                   `✅ Бот работает!\n` +
                   `📢 Канал: ${channelId}\n` +
                   `🔄 Интервал: ${checkInterval} минут`;
    
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
          console.log('Telegram API response:', data);
          
          if (res.statusCode === 200) {
            resolve({
              statusCode: 200,
              body: JSON.stringify({
                message: 'Test message sent successfully!',
                timestamp: new Date().toISOString(),
                telegramResponse: JSON.parse(data)
              })
            });
          } else {
            resolve({
              statusCode: 500,
              body: JSON.stringify({
                error: 'Failed to send message to Telegram',
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
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Function execution failed',
        message: error.message
      })
    };
  }
};
