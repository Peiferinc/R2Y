const natural = require('natural');
const tokenizer = new natural.SentenceTokenizer();

function splitStoryIntoSlides(storyText, maxCharactersPerSlide) {
    const sentences = storyText.match(/[^.!?]+[.!?]+/g);
    const slides = [];
    let currentSlide = '';

    for (const sentence of sentences) {
        if (currentSlide.length + sentence.length <= maxCharactersPerSlide) {
            currentSlide += sentence;
        } else {
            slides.push(currentSlide.trim());
            currentSlide = sentence;
        }
    }

    if (currentSlide.trim().length > 0) {
        slides.push(currentSlide.trim());
    }

    return slides;
}


module.exports = {
    splitStoryIntoSlides,
};
