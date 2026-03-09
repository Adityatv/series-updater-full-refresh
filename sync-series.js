#!/usr/bin/env node

const fs = require('fs').promises;
const axios = require('axios');
const { Octokit } = require('@octokit/rest');

const API_URL = 'https://dillzy-movie.cricketstream745.workers.dev/hollywood/series?offset=0';
const DATA_FILE = 'series.json';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function fetchFreshData() {
  console.log('🌐 Fetching FRESH data...');
  const { data } = await axios.get(API_URL, { 
    timeout: 30000,
    headers: { 'User-Agent': 'SeriesUpdater/1.0' }
  });
  console.log(`✅ Got ${data.length} series`);
  return data;
}

async function saveData(data) {
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(DATA_FILE, json);
  console.log(`💾 Saved ${data.length} series`);
  return Buffer.from(json).toString('base64');
}

async function commitData(owner, repo, data, count) {
  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path: DATA_FILE,
    message: `🔄 FULL REFRESH: ${count} series (${new Date().toISOString().split('T')[0]})`,
    content: data,
    branch: 'main'
  });
  console.log('✅ Committed!');
}

async function main() {
  try {
    const repo = process.env.GITHUB_REPOSITORY.split('/');
    const [owner, repoName] = repo;
    
    const freshData = await fetchFreshData();
    const fileData = await saveData(freshData);
    
    await commitData(owner, repoName, fileData, freshData.length);
    
    console.log(`🎉 DONE! ${freshData.length} series live!`);
    process.exit(0);
  } catch (e) {
    console.error('💥 ERROR:', e.message);
    process.exit(1);
  }
}

if (require.main === module) main();
