const fs = require('fs').promises;
const axios = require('axios');
const { Octokit } = require('@octokit/rest');

const API_URL = 'https://dillzy-movie.cricketstream745.workers.dev/hollywood/series?offset=0';
const DATA_FILE = 'series.json';

async function main() {
  try {
    console.log('🚀 FULL REFRESH START');
    
    const response = await axios.get(API_URL, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const data = response.data;
    console.log(`📥 Fetched ${data.length} items`);
    
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('💾 File saved');
    
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const repo = process.env.GITHUB_REPOSITORY.split('/');
    
    const content = Buffer.from(await fs.readFile(DATA_FILE, 'utf8')).toString('base64');
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: repo[0],
      repo: repo[1],
      path: DATA_FILE,
      message: `🔄 Refresh: ${data.length} series`,
      content: content,
      branch: 'main'
    });
    
    console.log('✅ SUCCESS!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
