const fetch = require('node-fetch');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = 'casalemanuel135-wq';
  const REPO_NAME = 'alpinaautos';
  const FILE_PATH = 'data.json';
  const BRANCH = 'main';

  try {
    if (event.httpMethod === 'GET') {
      // Get data from GitHub
      const response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (response.status === 404) {
        // File doesn't exist yet, return empty data
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({})
        };
      }

      const data = await response.json();
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      
      return {
        statusCode: 200,
        headers,
        body: content
      };
    }

    if (event.httpMethod === 'POST') {
      // Save data to GitHub
      const newData = JSON.parse(event.body);

      // First, try to get the current file to get its SHA
      let sha = null;
      const getResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (getResponse.status === 200) {
        const currentFile = await getResponse.json();
        sha = currentFile.sha;
      }

      // Update or create the file
      const content = Buffer.from(JSON.stringify(newData, null, 2)).toString('base64');
      
      const updateResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Update site data',
            content: content,
            branch: BRANCH,
            ...(sha && { sha })
          })
        }
      );

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(error.message);
      }

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
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
