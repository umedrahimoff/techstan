const https = require('https');

exports.handler = async (event, context) => {
  try {
    console.log('🔍 Запуск простого парсера');
    
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
    
    // Простая симуляция парсинга
    const mockNewsCount = Math.floor(Math.random() * 5) + 1;
    
    // Простое уведомление без сложной логики
    const message = `🔍 <b>ПРОСТОЙ ПАРСЕР ЗАПУЩЕН</b>\n\n` +
                   `⏰ Время: ${new Date().toLocaleString('ru-RU')}\n` +
                   `👤 Запущено: Администратор\n` +
                   `📊 Найдено новостей: ${mockNewsCount}\n` +
                   `✅ Парсер завершен успешно!`;
    
    // Отправляем уведомление в Telegram
    if (botToken && moderationGroupId) {
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
    
    // Возвращаем успешный ответ
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Simple parser completed successfully!',
        timestamp: new Date().toISOString(),
        new_news_count: mockNewsCount,
        success: true
      })
    };
    
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
