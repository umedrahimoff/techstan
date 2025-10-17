exports.handler = async (event, context) => {
  try {
    console.log('📊 Получение статистики');
    
    // Здесь можно добавить логику для получения статистики из базы данных
    // Пока возвращаем заглушку
    const stats = {
      total_parsed: 0,
      pending_count: 0,
      published_count: 0,
      rejected_count: 0,
      parsed_today: 0,
      published_today: 0,
      rejected_today: 0,
      last_check: new Date().toISOString(),
      check_interval: 30
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(stats)
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to get statistics',
        message: error.message
      })
    };
  }
};
