# ScholarSync Chrome Extension

The complete ScholarSync experience in your browser - Research assistant, AI disclosure generator, prompt coach, grammar checker, and AI usage tracking.

## Features

### 1. Research Assistant
- Search 200M+ academic papers from Semantic Scholar
- Generate citations in APA, MLA, Chicago, BibTeX formats instantly
- One-click copy citations
- Direct links to PDFs and paper pages

### 2. AI Disclosure Generator
- Select assignment type (Essay, Research Paper, Lab Report, etc.)
- Choose from popular AI tools (ChatGPT, Claude, Gemini, etc.)
- Generate professional disclosure statements
- Save and export disclosures

### 3. Prompt Coach
- Analyze your prompts for effectiveness
- Get a score from 0-100
- Receive actionable improvement suggestions
- Learn to write better prompts

### 4. Grammar Checker
- Check for spelling and grammar errors
- Get style suggestions
- View word count and readability stats
- One-click fixes

### 5. AI Usage Tracking
- Automatically track visits to AI tools
- Monitor prompt usage across platforms
- View daily and total statistics
- Toggle tracking on/off

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "ScholarSync"
3. Click "Add to Chrome"

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the `chrome-extension` folder
6. The extension is now installed!

## Usage

### Quick Access
- Click the ScholarSync icon in your toolbar
- Use keyboard shortcut: `Ctrl+Shift+S` (Windows) or `Cmd+Shift+S` (Mac)

### Research Search
- Use `Ctrl+Shift+R` to quickly search selected text
- Right-click selected text and choose "Search in ScholarSync"

### On AI Tool Pages
When you visit ChatGPT, Claude, Gemini, or other AI tools:
- A small indicator shows tracking is active
- Your prompts are automatically logged for disclosure generation
- Select text to analyze prompts or check grammar

### Context Menu
Right-click on any page to:
- Search selected text for papers
- Check grammar of selected text
- Analyze selected text as a prompt
- Generate AI disclosure

## Permissions

- **storage**: Save your settings, history, and disclosures locally
- **activeTab**: Access the current tab for text selection features
- **contextMenus**: Add right-click menu options
- **clipboardWrite**: Copy citations to clipboard
- **host permissions**: Access Semantic Scholar API for paper search

## Privacy

- All data is stored locally in your browser
- No data is sent to external servers except:
  - Semantic Scholar API for paper searches (query only)
  - ScholarSync API for premium features (optional)
- Tracking can be disabled at any time
- Clear all data from Chrome settings

## File Structure

```
chrome-extension/
├── manifest.json      # Extension configuration
├── popup.html         # Main popup interface
├── popup.js          # Popup functionality
├── background.js     # Background service worker
├── content.js        # Content script for AI tools
├── content.css       # Content script styles
├── icons/            # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md         # This file
```

## Development

### Prerequisites
- Chrome browser
- Basic knowledge of JavaScript

### Making Changes
1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the ScholarSync extension
4. Test your changes

### Building for Production
1. Replace placeholder icons with proper branded icons
2. Update version in `manifest.json`
3. Zip the extension folder
4. Upload to Chrome Web Store Developer Dashboard

## Support

- Website: https://scholarsync.app
- Email: support@scholarsync.app
- Issues: https://github.com/scholarsync/extension/issues

## License

MIT License - see LICENSE file for details

---

Built with love for students who want to use AI responsibly.
