const https = require('https');
const { checkAuth } = require('./auth-middleware');

exports.handler = async (event, context) => {
  try {
    console.log('❌ Отклонение новости');
    
    // Проверка авторизации
    const authError = checkAuth(event);
    if (authError) return authError;
    
    const { newsId } = JSON.parse(event.body || '{}');
    const botToken = process.env.BOT_TOKEN;
    const moderationGroupId = process.env.MODERATION_GROUP_ID;
    
    if (!botToken || !newsId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Missing required parameters'
        })
      };
    }
    
    // Отправляем уведомление об отклонении
    const message = `❌ <b>НОВОСТЬ ОТКЛОНЕНА</b>\n\n` +
                   `🆔 ID: ${newsId}\n` +
                   `⏰ Время: ${new Date().toLocaleString('ru-RU')}\n` +
                   `👤 Отклонено: Администратор\n` +
                   `🚫 Новость не будет опубликована`;
    
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
          console.log('Rejection notification sent:', data);
          
          resolve({
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              message: 'News rejected successfully!',
              newsId: newsId,
              timestamp: new Date().toISOString()
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
            error: 'Failed to send rejection notification',
            message: err.message
          })
        });
      });
      
      req.write(postData);
      req.end();
    });
    
  } catch (error) {
    console.error('Error rejecting news:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to reject news',
        message: error.message
      })
    };
  }
};
