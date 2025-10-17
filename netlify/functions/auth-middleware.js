// Middleware для проверки авторизации
function checkAuth(event) {
  // Простая проверка авторизации через заголовки
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  const adminToken = process.env.ADMIN_TOKEN || 'techstan_admin_2024';
  
  if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Unauthorized',
        message: 'Требуется авторизация для доступа к админ панели'
      })
    };
  }
  
  return null; // Авторизация прошла успешно
}

module.exports = { checkAuth };
