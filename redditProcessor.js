/*Handle fetching data from Reddit.
This module can export functions for fetching Reddit posts and generating image slides.
*/
const fse = require('fs-extra'); // Use fs-extra for directory operations
const axios = require('axios');
const subredditURL =
  'https://www.reddit.com/r/pettyrevenge/top/.json?t=year&limit=2'; // Limit to 10 posts for now
const puppeteer = require('puppeteer');
const { loadProcessedData, saveProcessedData } = require('./fileHandler');
const { splitStoryIntoSlides } = require('./storyProcessor');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { languagePairs, translateText } = require('./translationService'); // Import supported languages

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
    executablePath:
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });

  const { folderIndex, processedStories } = loadProcessedData();
  let currentFolderIndex = folderIndex;

  const maxCharactersPerSlide = 1000;

  for (let i = 0; i < posts.length; i++) {
    currentFolderIndex=folderIndex+i;
    const post = posts[i];
    // Check if the story URL has been processed before
    if (processedStories.some((story) => story.url === post.url)) {
      console.log(`Story already processed: ${post.url}`);
      continue; // Skip processing if already processed
    }

    const storyText = post.selftext;

    // Split the story into slides based on sentence boundaries
    const storySlides = splitStoryIntoSlides(storyText, maxCharactersPerSlide);

    // Generate English slides
    const englishFolderName = `story_${currentFolderIndex}`;
    const englishFolderPath = path.join(
      __dirname,
      'images',
      'English',
      englishFolderName
    );

    if (!fs.existsSync(englishFolderPath)) {
      fs.mkdirSync(englishFolderPath, { recursive: true });
    }

    // Process each slide of the English story
    for (let slideIndex = 0; slideIndex < storySlides.length; slideIndex++) {
      const slideText = storySlides[slideIndex];

      // Construct the screenshot path within the story's folder
      const screenshotPath = path.join(
        englishFolderPath,
        `slide_${slideIndex}.png`
      );

      const templatePath = path.join(__dirname, 'templates', 'slide.html');
      const page = await browser.newPage();
      await page.goto(`file://${templatePath}`);

      await page.evaluate((text) => {
        document.querySelector('.slide p').textContent = text;
      }, slideText);

      // Capture a screenshot of the slide with larger dimensions
      const largerScreenshotPath = path.join(
        __dirname,
        'temp',
        `larger_slide_${slideIndex}.png`
      );
      try {
        await page.screenshot({
          path: largerScreenshotPath,
          clip: { x: 0, y: 0, width: imageWidth, height: imageHeight },
        });

        if (fs.existsSync(largerScreenshotPath)) {
          // Crop the larger screenshot to the desired dimensions using sharp and save it as the final screenshot
          await sharp(largerScreenshotPath)
            .extract({ width: imageWidth, height: imageHeight, left: 0, top: 0 })
            .toFile(screenshotPath);
          fs.unlinkSync(largerScreenshotPath);
        } else {
          console.error(`Temporary larger screenshot not found: ${largerScreenshotPath}`);
        }
      } catch (error) {
        console.error(`Error capturing or processing screenshot: ${error}`);
      }

      console.log(`Generated slide ${slideIndex} in folder 'English' (${englishFolderName}): ${screenshotPath}`);
    }

    // Add the processed story data to the list for English
    processedStories.push({
      url: post.url,
      folderName: englishFolderName,
    });

    // Save the updated data to the file
    saveProcessedData({ folderIndex: currentFolderIndex, processedStories });

    // Translate the story for each language and generate slides
    for (const language of languagePairs) {
        const { language: languageName, abbreviation } = language;
        const translatedStory = await translateText(storyText, abbreviation);
  
        // Use the same folder name for all languages
        const storyFolderName = `story_${currentFolderIndex}`;
        const storyFolderPath = path.join(
          __dirname,
          'images',
          languageName,
          storyFolderName
        );
  
        // Process each slide of the translated story
        for (let slideIndex = 0; slideIndex < storySlides.length; slideIndex++) {
          const slideText = storySlides[slideIndex];

          const translatedSlide = await translateText(slideText, abbreviation);

        // Construct the screenshot path within the story's folder
        const screenshotPath = path.join(
          storyFolderPath,
          `slide_${slideIndex}.png`
        );

        await fse.ensureDir(storyFolderPath);

        const templatePath = path.join(__dirname, 'templates', 'slide.html');
        const page = await browser.newPage();
        await page.goto(`file://${templatePath}`);

        await page.evaluate((text) => {
          document.querySelector('.slide p').textContent = text;
        }, translatedSlide);

        // Capture a screenshot of the slide with larger dimensions
        const largerScreenshotPath = path.join(
          __dirname,
          'temp',
          `larger_slide_${slideIndex}.png`
        );
        try {
          await page.screenshot({
            path: largerScreenshotPath,
            clip: { x: 0, y: 0, width: imageWidth, height: imageHeight },
          });

          if (fs.existsSync(largerScreenshotPath)) {
            // Crop the larger screenshot to the desired dimensions using sharp and save it as the final screenshot
            await sharp(largerScreenshotPath)
              .extract({ width: imageWidth, height: imageHeight, left: 0, top: 0 })
              .toFile(screenshotPath);
            fs.unlinkSync(largerScreenshotPath);
          } else {
            console.error(`Temporary larger screenshot not found: ${largerScreenshotPath}`);
          }
        } catch (error) {
          console.error(`Error capturing or processing screenshot: ${error}`);
        }

        console.log(`Generated slide ${slideIndex} in folder '${storyFolderName}' (${languageName}): ${screenshotPath}`);
      }
    }

    // Increment the current folder index only if a new story is loaded
    if (!processedStories.some((story) => story.url === post.url)) {
      currentFolderIndex++;
    }

    // Save the updated data to the file
    saveProcessedData({ folderIndex: currentFolderIndex, processedStories });
  }

  await browser.close();
}


module.exports = {
  fetchTopRedditPosts,
  generateImageSlides,
};
