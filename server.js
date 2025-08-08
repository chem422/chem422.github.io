// server.js
const express = require('express');
const fileUpload = require('express-fileupload');
const fetch = require('node-fetch');
const app = express();

app.use(fileUpload());
app.use(express.json());

// Environment variable for GitHub PAT
const GITHUB_PAT = process.env.GITHUB_PAT || 'your-personal-access-token';
const REPO = 'your-username/game-platform-files';
const UPLOAD_PATH = 'uploads/';

app.post('/upload-to-github', async (req, res) => {
    try {
        if (!req.files || !req.files.gameFile) {
            return res.status(400).json({ error: 'No file provided' });
        }
        const file = req.files.gameFile;
        const fileContent = file.data.toString('base64');
        const fileName = encodeURIComponent(file.name);

        const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${UPLOAD_PATH}${fileName}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_PAT}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Upload ${file.name}`,
                content: fileContent
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to upload file to GitHub');
        }

        res.json({ downloadUrl: data.content.download_url });
    } catch (error) {
        console.error('Error uploading to GitHub:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
