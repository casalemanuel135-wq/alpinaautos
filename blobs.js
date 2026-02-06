const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const store = getStore("alpina-autos-data");
    
    if (event.httpMethod === 'GET') {
      // Get data
      const key = event.queryStringParameters?.key || 'site-data';
      const data = await store.get(key);
      
      return {
        statusCode: 200,
        headers,
        body: data || '{}'
      };
    }
    
    if (event.httpMethod === 'POST') {
      // Save data
      const { key, value } = JSON.parse(event.body);
      await store.set(key || 'site-data', value);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
