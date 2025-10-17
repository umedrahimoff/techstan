exports.handler = async (event, context) => {
  try {
    console.log('💾 Сохранение настроек');
    
    const { check_interval } = JSON.parse(event.body || '{}');
    
    if (!check_interval || check_interval < 5 || check_interval > 1440) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Invalid check_interval. Must be between 5 and 1440 minutes.'
        })
      };
    }
    
    // В реальном проекте здесь бы сохранялись настройки в базу данных
    // Пока просто возвращаем успех
    console.log(`Settings saved: check_interval = ${check_interval} minutes`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Settings saved successfully!',
        check_interval: check_interval,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error saving settings:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to save settings',
        message: error.message
      })
    };
  }
};
