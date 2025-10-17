exports.handler = async (event, context) => {
  try {
    console.log('📰 Получение всех новостей');
    
    // Заглушка для всех новостей
    const allNews = [
      {
        id: 1,
        title: "Казахстанский стартап привлек $10 млн инвестиций",
        link: "https://example.com/news1",
        source: "Digital Business",
        timestamp: new Date().toISOString(),
        status: "published"
      },
      {
        id: 2,
        title: "Новая технология ИИ в Узбекистане",
        link: "https://example.com/news2",
        source: "Spot.uz", 
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: "pending"
      },
      {
        id: 3,
        title: "Финтех компания запустила новый продукт",
        link: "https://example.com/news3",
        source: "The Tech",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: "rejected"
      },
      {
        id: 4,
        title: "Блокчейн проект получил финансирование",
        link: "https://example.com/news4",
        source: "Blue Screen",
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        status: "published"
      }
    ];
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(allNews)
    };
  } catch (error) {
    console.error('Error getting all news:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to get all news',
        message: error.message
      })
    };
  }
};
