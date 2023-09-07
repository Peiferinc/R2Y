c
const { fetchTopRedditPosts, generateImageSlides } = require('./redditProcessor');

// Define constants and other configurations

async function main() {
    const topPosts = await fetchTopRedditPosts();
    await generateImageSlides(topPosts);
}

main();