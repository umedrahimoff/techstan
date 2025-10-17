const { spawn } = require('child_process');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    console.log('🚀 Запуск Netlify Function для Telegram бота');
    
    // Путь к Python скрипту
    const pythonScript = path.join(__dirname, 'bot.py');
    
    // Запускаем Python скрипт
    const python = spawn('python3', [pythonScript], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    });
    
    let output = '';
    let error = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Python output:', data.toString());
    });
    
    python.stderr.on('data', (data) => {
      error += data.toString();
      console.error('Python error:', data.toString());
    });
    
    return new Promise((resolve, reject) => {
      python.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        
        if (code === 0) {
          resolve({
            statusCode: 200,
            body: JSON.stringify({
              message: 'Bot function executed successfully',
              output: output,
              timestamp: new Date().toISOString()
            })
          });
        } else {
          resolve({
            statusCode: 500,
            body: JSON.stringify({
              error: 'Python script failed',
              errorOutput: error,
              exitCode: code
            })
          });
        }
      });
      
      python.on('error', (err) => {
        console.error('Failed to start Python process:', err);
        reject({
          statusCode: 500,
          body: JSON.stringify({
            error: 'Failed to start Python process',
            message: err.message
          })
        });
      });
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
