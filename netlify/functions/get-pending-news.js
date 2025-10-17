exports.handler = async (event, context) => {
  try {
    console.log('📋 Получение новостей на модерации');
    
    // Заглушка для новостей на модерации
    const pendingNews = [
      {
        id: 1,
        title: "Казахстанский стартап привлек $10 млн инвестиций",
        link: "https://example.com/news1",
        source: "Digital Business",
        timestamp: new Date().toISOString(),
        status: "pending"
      },
      {
        id: 2,
        title: "Новая технология ИИ в Узбекистане",
        link: "https://example.com/news2", 
        source: "Spot.uz",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: "pending"
      }
    ];
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(pendingNews)
    };
  } catch (error) {
    console.error('Error getting pending news:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to get pending news',
        message: error.message
      })
    };
  }
};
