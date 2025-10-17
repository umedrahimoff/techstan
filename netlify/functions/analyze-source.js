const https = require('https');

// Функция для анализа структуры сайта
async function analyzeWebsite(url, sourceName) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Анализируем структуру ${sourceName}: ${url}`);
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Анализируем HTML структуру
          const analysis = analyzeHTMLStructure(data, sourceName);
          resolve(analysis);
        } catch (error) {
          console.error(`Ошибка анализа ${sourceName}:`, error);
          resolve({
            source: sourceName,
            url: url,
            error: error.message,
            structure: null
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Ошибка запроса к ${sourceName}:`, error);
      resolve({
        source: sourceName,
        url: url,
        error: error.message,
        structure: null
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        source: sourceName,
        url: url,
        error: 'Timeout',
        structure: null
      });
    });
  });
}

// Анализ HTML структуры
function analyzeHTMLStructure(html, sourceName) {
  const analysis = {
    source: sourceName,
    title: '',
    selectors: {
      articles: [],
      titles: [],
      links: [],
      dates: [],
      descriptions: []
    },
    patterns: {
      titlePatterns: [],
      linkPatterns: [],
      datePatterns: []
    }
  };
  
  // Ищем заголовки статей
  const titleSelectors = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    '.title', '.headline', '.article-title', '.post-title',
    '.news-title', '.entry-title', '.content-title'
  ];
  
  titleSelectors.forEach(selector => {
    const regex = new RegExp(`<${selector}[^>]*>([^<]+)</${selector}>`, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
      const title = match[1].trim();
      if (title.length > 10 && title.length < 200) {
        analysis.selectors.titles.push({
          selector: selector,
          text: title,
          fullMatch: match[0]
        });
      }
    }
  });
  
  // Ищем ссылки на статьи
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1];
    const text = linkMatch[2].trim();
    
    if (text.length > 10 && text.length < 200 && 
        (href.includes('/article/') || href.includes('/news/') || href.includes('/post/'))) {
      analysis.selectors.links.push({
        href: href,
        text: text,
        fullMatch: linkMatch[0]
      });
    }
  }
  
  // Ищем даты
  const dateSelectors = [
    '.date', '.time', '.published', '.created', '.timestamp',
    '.article-date', '.post-date', '.news-date'
  ];
  
  dateSelectors.forEach(selector => {
    const regex = new RegExp(`<[^>]*class=["'][^"']*${selector}[^"']*["'][^>]*>([^<]+)</[^>]*>`, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
      const date = match[1].trim();
      if (date.length > 5 && date.length < 50) {
        analysis.selectors.dates.push({
          selector: selector,
          text: date,
          fullMatch: match[0]
        });
      }
    }
  });
  
  // Ищем описания
  const descSelectors = [
    '.description', '.excerpt', '.summary', '.content',
    '.article-content', '.post-content', '.news-content'
  ];
  
  descSelectors.forEach(selector => {
    const regex = new RegExp(`<[^>]*class=["'][^"']*${selector}[^"']*["'][^>]*>([^<]+)</[^>]*>`, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
      const desc = match[1].trim();
      if (desc.length > 20 && desc.length < 500) {
        analysis.selectors.descriptions.push({
          selector: selector,
          text: desc,
          fullMatch: match[0]
        });
      }
    }
  });
  
  // Извлекаем title страницы
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    analysis.title = titleMatch[1].trim();
  }
  
  return analysis;
}

exports.handler = async (event, context) => {
  try {
    console.log('🔍 Анализ структуры источников новостей');
    
    const sources = [
      { url: 'https://digitalbusiness.kz/', name: 'Digital Business' },
      { url: 'https://spot.uz/', name: 'Spot.uz' },
      { url: 'https://the-tech.kz/', name: 'The Tech' },
      { url: 'https://bluescreen.kz/', name: 'Blue Screen' }
    ];
    
    const results = [];
    
    for (const source of sources) {
      const analysis = await analyzeWebsite(source.url, source.name);
      results.push(analysis);
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Source analysis completed',
        timestamp: new Date().toISOString(),
        sources: results
      })
    };
    
  } catch (error) {
    console.error('Error analyzing sources:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to analyze sources',
        message: error.message
      })
    };
  }
};
