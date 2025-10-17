exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Test function is working!',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        BOT_TOKEN: process.env.BOT_TOKEN ? 'SET' : 'NOT SET',
        MODERATION_GROUP_ID: process.env.MODERATION_GROUP_ID,
        CHANNEL_ID: process.env.CHANNEL_ID
      }
    })
  };
};
