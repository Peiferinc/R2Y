const fs = require('fs');
const path = require('path');

// Define the directory path to "English"
const englishDirectoryPath = path.join(__dirname, 'images', 'English');

// Function to recursively delete a directory and its contents
function deleteFolderRecursive(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file) => {
            const curPath = path.join(directoryPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // Recursive call for directories
                deleteFolderRecursive(curPath);
            } else {
                // Delete files
                fs.unlinkSync(curPath);
            }
        });
        // Delete the directory itself
        fs.rmdirSync(directoryPath);
    }
}

// Delete "English" directory and its contents
deleteFolderRecursive(englishDirectoryPath);

// Delete "processed_stories.json" and "folder_index.json" files
const jsonFilePath = path.join(__dirname, 'processed_stories.json');
const indexFilePath = path.join(__dirname, 'folder_index.json');

if (fs.existsSync(jsonFilePath)) {
    fs.unlinkSync(jsonFilePath);
}

if (fs.existsSync(indexFilePath)) {
    fs.unlinkSync(indexFilePath);
}

console.log('All folders and files have been deleted.');
