const fs = require('fs');
const path = require('path');
// Define the path to the JSON file
const jsonFilePath = path.join(__dirname, 'processed_stories.json');

function loadProcessedData() {
    try {
        const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
        return JSON.parse(jsonData);
    } catch (error) {
        // If the file does not exist or there's an error reading it, return an empty object
        return { folderIndex: 1, processedStories: [] };
    }
}

function saveProcessedData(data) {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(jsonFilePath, jsonData, 'utf8');
}

module.exports = {
    loadProcessedData,
    saveProcessedData,
};
