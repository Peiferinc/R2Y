/*Handle fetching data from Reddit.
This module can export functions for fetching Reddit posts and generating image slides.
*/
const axios = require('axios')
const subredditURL = 'https://www.reddit.com/r/pettyrevenge/top/.json?t=year&limit=10'; // Limit to 10 posts for now
const puppeteer = require('puppeteer');
const { loadProcessedData, saveProcessedData } = require('./fileHandler');
const { splitStoryIntoSlides } = require('./storyProcessor');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); 

const imageWidth = 266; // One-third of 800px
const imageHeight = 720; // Full height of the YouTube screen

async function fetchTopRedditPosts() {
    try {
        const response = await axios.get(subredditURL);
        const topPosts = response.data.data.children;
        const postsData = topPosts.map((post) => ({
            url: post.data.url,
            selftext: post.data.selftext,
        }));

        return postsData;
    } catch (error) {
        console.error('Error fetching top Reddit posts:', error);
        throw error;
    }
}

async function generateImageSlides(posts) {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });

    let processedData = loadProcessedData(); // Load processed data
    let { folderIndex, processedStories } = processedData; // Extract folderIndex and processedStories

    const maxCharactersPerSlide = 1000;

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        // Check if the story URL has been processed before
        if (processedStories.some((story) => story.url === post.url)) {
            console.log(`Story already processed: ${post.url}`);
            continue; // Skip processing if already processed
        }

        const storyText = post.selftext;

        // Split the story into slides based on sentence boundaries
        const storySlides = splitStoryIntoSlides(storyText, maxCharactersPerSlide);

        // Create a folder name based on the loaded folder index
        const storyFolderName = `story_${folderIndex}`;
        const storyFolderPath = path.join(__dirname, 'images', 'English', storyFolderName); // Store in the "English" folder (can change to other languages later);

        if (!fs.existsSync(storyFolderPath)) {
            fs.mkdirSync(storyFolderPath, { recursive: true });
        }

        // Process each slide of the story
        for (let slideIndex = 0; slideIndex < storySlides.length; slideIndex++) {
            const slideText = storySlides[slideIndex];

            // Construct the screenshot path within the story's folder
            const screenshotPath = path.join(storyFolderPath, `slide_${slideIndex}.png`);

            const templatePath = path.join(__dirname, 'templates', 'slide.html');
            const page = await browser.newPage();
            await page.goto(`file://${templatePath}`);

            await page.evaluate((text) => {
                document.querySelector('.slide p').textContent = text;
            }, slideText);

            // Capture a screenshot of the slide with larger dimensions
            const largerScreenshotPath = path.join(__dirname, 'temp', `larger_slide_${slideIndex}.png`);
            await page.screenshot({ path: largerScreenshotPath, clip: { x: 0, y: 0, width: imageWidth, height: imageHeight } });

            if (fs.existsSync(largerScreenshotPath)) {
                // Crop the larger screenshot to the desired dimensions using sharp and save it as the final screenshot
                await sharp(largerScreenshotPath)
                    .extract({ width: imageWidth, height: imageHeight, left: 0, top: 0 })
                    .toFile(screenshotPath);
                fs.unlinkSync(largerScreenshotPath);
            } else {
                console.error(`Temporary larger screenshot not found: ${largerScreenshotPath}`);
            }

            console.log(`Generated slide ${slideIndex} in folder '${storyFolderName}': ${screenshotPath}`);
        }

        // Add the processed story data to the list
        processedStories.push({
            url: post.url,
            folderName: storyFolderName,
        });

        // Increment the folder index
        folderIndex++;

        // Update the processed data with the new folderIndex and processedStories
        processedData = {
            folderIndex,
            processedStories,
        };

        // Save the updated processed data
        saveProcessedData(processedData);
    }

    await browser.close();
}


module.exports = {
    fetchTopRedditPosts,
    generateImageSlides,
};
