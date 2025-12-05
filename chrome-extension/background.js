// PenBotAI Chrome Extension - Background Service Worker

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  // Only initialize if this is a fresh install (no existing data)
  chrome.storage.local.get(['sessions'], (result) => {
    if (result.sessions === undefined) {
      chrome.storage.local.set({
        sessions: [],
        prompts: [],
        disclosures: [],
        isTracking: true,
        plan: 'free'
      });
    }
  });

  // Create context menus
  chrome.contextMenus.create({
    id: 'searchPaper',
    title: 'Search for "%s" in PenBotAI',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'checkGrammar',
    title: 'Check grammar with PenBotAI',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'analyzePrompt',
    title: 'Analyze this as a prompt',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'generateDisclosure',
    title: 'Generate AI disclosure',
    contexts: ['page']
  });

  console.log('PenBotAI Extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'searchPaper' && info.selectionText) {
    // Open popup with search query
    chrome.storage.local.set({ pendingSearch: info.selectionText });
    chrome.action.openPopup();
  } else if (info.menuItemId === 'checkGrammar' && info.selectionText) {
    chrome.storage.local.set({ pendingGrammar: info.selectionText });
    chrome.action.openPopup();
  } else if (info.menuItemId === 'analyzePrompt' && info.selectionText) {
    chrome.storage.local.set({ pendingPrompt: info.selectionText });
    chrome.action.openPopup();
  } else if (info.menuItemId === 'generateDisclosure') {
    chrome.tabs.create({ url: 'https://penbotai.com/disclosure' });
  }
});

// Detect which AI tool based on URL
function detectTool(url) {
  if (url.includes('chat.openai.com')) return 'ChatGPT';
  if (url.includes('claude.ai')) return 'Claude';
  if (url.includes('gemini.google.com')) return 'Gemini';
  if (url.includes('copilot.microsoft.com')) return 'Copilot';
  if (url.includes('perplexity.ai')) return 'Perplexity';
  if (url.includes('bard.google.com')) return 'Bard';
  if (url.includes('bing.com/chat')) return 'Bing Chat';
  return null;
}

// Check if date is today
function isToday(date) {
  return new Date().toDateString() === new Date(date).toDateString();
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRACK_SESSION') {
    trackSession(message.tool, message.url);
    sendResponse({ success: true });
  } else if (message.type === 'TRACK_PROMPT') {
    trackPrompt(message.prompt, message.url);
    sendResponse({ success: true });
  } else if (message.type === 'GET_STATS') {
    getStats().then(sendResponse);
    return true; // Will respond asynchronously
  }
  return true;
});

// Track a new AI session
async function trackSession(tool, url) {
  const data = await chrome.storage.local.get(['sessions', 'isTracking']);

  if (!data.isTracking) return;

  const sessions = data.sessions || [];
  const existingSession = sessions.find(
    s => s.tool === tool && isToday(s.timestamp)
  );

  if (!existingSession) {
    sessions.unshift({
      id: Date.now().toString(),
      tool,
      url,
      timestamp: new Date().toISOString(),
      promptCount: 0
    });

    await chrome.storage.local.set({
      sessions: sessions.slice(0, 100) // Keep last 100 sessions
    });

    updateBadge();
  }
}

// Track a prompt
async function trackPrompt(prompt, url) {
  const data = await chrome.storage.local.get(['sessions', 'prompts', 'isTracking']);

  if (!data.isTracking) return;

  const sessions = data.sessions || [];
  const prompts = data.prompts || [];
  const tool = detectTool(url);

  // Update session prompt count
  const existingSession = sessions.find(
    s => s.tool === tool && isToday(s.timestamp)
  );

  if (existingSession) {
    existingSession.promptCount = (existingSession.promptCount || 0) + 1;
  }

  // Add to prompts history
  prompts.unshift({
    id: Date.now().toString(),
    text: prompt.substring(0, 500), // Limit length
    tool: tool || 'Unknown',
    url,
    timestamp: new Date().toISOString()
  });

  await chrome.storage.local.set({
    sessions,
    prompts: prompts.slice(0, 200) // Keep last 200 prompts
  });

  updateBadge();
}

// Get usage statistics
async function getStats() {
  const data = await chrome.storage.local.get(['sessions', 'prompts', 'disclosures']);

  const today = new Date().toDateString();
  const sessions = data.sessions || [];
  const prompts = data.prompts || [];

  const todaySessions = sessions.filter(s => isToday(s.timestamp));
  const todayPrompts = prompts.filter(p => isToday(p.timestamp));

  const toolUsage = {};
  sessions.forEach(s => {
    toolUsage[s.tool] = (toolUsage[s.tool] || 0) + (s.promptCount || 1);
  });

  return {
    todaySessions: todaySessions.length,
    todayPrompts: todayPrompts.length,
    totalSessions: sessions.length,
    totalPrompts: prompts.length,
    totalDisclosures: (data.disclosures || []).length,
    toolUsage
  };
}

// Update badge with today's count
async function updateBadge() {
  const data = await chrome.storage.local.get(['sessions']);
  const sessions = data.sessions || [];

  const todayCount = sessions.filter(s => isToday(s.timestamp)).length;

  if (todayCount > 0) {
    chrome.action.setBadgeText({ text: todayCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick-search') {
    // Get selected text and search
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => window.getSelection().toString()
        }).then((results) => {
          const selectedText = results[0]?.result;
          if (selectedText) {
            chrome.storage.local.set({ pendingSearch: selectedText });
            chrome.action.openPopup();
          }
        }).catch(() => {
          // Silently fail on protected pages (chrome://, chrome-extension://, etc.)
        });
      }
    });
  }
});

// Update badge on startup
updateBadge();

// Listen for tab updates to track AI tool visits
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const tool = detectTool(tab.url);
    if (tool) {
      trackSession(tool, tab.url);
    }
  }
});
