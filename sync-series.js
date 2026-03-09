#!/usr/bin/env node
import fs from 'fs/promises';
import axios from 'axios';
import { Octokit } from '@octokit/rest';

const API_URL = 'https://dillzy-movie.cricketstream745.workers.dev/hollywood/series?offset=0';
const DATA_FILE = 'series.json';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function main() {
  try {
    console.log('🚀 Starting FULL REFRESH...');
    
    // 1. Fetch fresh data
    const { data } = await axios.get(API_URL, { 
      timeout: 30000,
      headers: { 'User-Agent': 'SeriesBot/1.0' }
    });
    console.log(`✅ Fetched ${data.length} series`);

    // 2. Save to file
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('💾 Saved to series.json');

    // 3. Commit (using checkout SHA)
    const repo = process.env.GITHUB_REPOSITORY.split('/');
    const content = Buffer.from(await fs.readFile(DATA_FILE)).toString('base64');
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: repo[0], repo: repo[1], path: DATA_FILE,
      message: `🔄 FULL REFRESH: ${data.length} series`,
      content,
      branch: 'main'
    });
    
    console.log('✅ COMMIT SUCCESS!');
  } catch (error) {
    console.error('💥 ERROR:', error.message);
    process.exit(1);
  }
}

main();
