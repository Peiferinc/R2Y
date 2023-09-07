const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { fetchTopRedditPosts, generateImageSlides } = require('./redditProcessor');

// Define constants and other configurations

async function main() {
    const topPosts = await fetchTopRedditPosts();
    await generateImageSlides(topPosts);
}

main();