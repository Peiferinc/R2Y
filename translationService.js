const { Translate } = require('@google-cloud/translate').v2;
const fs = require('fs');
const path = require('path');

const keyFilename = './reddit2youtube-398320-2584a029b2fe.json';
const translate = new Translate({ keyFilename });

const languagePairs = [
    { language: 'Ukrainian', abbreviation: 'uk' },
    { language: 'French', abbreviation: 'fr' },
    // Add more languages as needed
];

async function translateText(text, targetLanguage) {
    try {
        const [translation] = await translate.translate(text, targetLanguage);
        return translation;
    } catch (error) {
        console.error('Error translating text:', error);
        throw error;
    }
}

async function translateStory(storyText, languages) {
    const translatedStory = {};

    for (const language of languages) {
        const { language: languageName, abbreviation } = language;
        const translatedContent = await translateText(storyText, abbreviation);
        translatedStory[languageName] = translatedContent;
    }

    return translatedStory;
}

module.exports = {
    translateText,
    translateStory,
    languagePairs,
};
