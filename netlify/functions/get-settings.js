exports.handler = async (event, context) => {
  try {
    console.log('⚙️ Получение настроек');
    
    const settings = {
      check_interval: parseInt(process.env.CHECK_INTERVAL) || 30,
      moderation_group_id: process.env.MODERATION_GROUP_ID || '',
      channel_id: process.env.CHANNEL_ID || '',
      bot_token: process.env.BOT_TOKEN ? '***' : ''
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(settings)
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to get settings',
        message: error.message
      })
    };
  }
};
