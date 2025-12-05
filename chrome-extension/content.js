// ScholarSync Chrome Extension - Content Script
// Runs on AI tool pages to track usage and provide features

(function() {
  'use strict';

  // Detect which tool we're on
  const currentUrl = window.location.href;
  let currentTool = 'Other';

  if (currentUrl.includes('chat.openai.com')) {
    currentTool = 'ChatGPT';
  } else if (currentUrl.includes('claude.ai')) {
    currentTool = 'Claude';
  } else if (currentUrl.includes('gemini.google.com')) {
    currentTool = 'Gemini';
  } else if (currentUrl.includes('copilot.microsoft.com')) {
    currentTool = 'Copilot';
  } else if (currentUrl.includes('perplexity.ai')) {
    currentTool = 'Perplexity';
  }

  // Track session start
  chrome.runtime.sendMessage({
    type: 'TRACK_SESSION',
    tool: currentTool,
    url: currentUrl
  });

  // Track prompts on different platforms
  let lastTrackedPrompt = '';

  function setupPromptTracking() {
    // ChatGPT
    if (currentTool === 'ChatGPT') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const userMessages = node.querySelectorAll('[data-message-author-role="user"]');
              userMessages.forEach((msg) => {
                const text = msg.textContent;
                if (text && text.length > 10 && text !== lastTrackedPrompt) {
                  lastTrackedPrompt = text;
                  chrome.runtime.sendMessage({
                    type: 'TRACK_PROMPT',
                    prompt: text.substring(0, 500),
                    url: currentUrl
                  });
                }
              });
            }
          });
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Claude
    if (currentTool === 'Claude') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const humanMessages = node.querySelectorAll('[data-testid="human-message"]');
              humanMessages.forEach((msg) => {
                const text = msg.textContent;
                if (text && text.length > 10 && text !== lastTrackedPrompt) {
                  lastTrackedPrompt = text;
                  chrome.runtime.sendMessage({
                    type: 'TRACK_PROMPT',
                    prompt: text.substring(0, 500),
                    url: currentUrl
                  });
                }
              });
            }
          });
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Generic: Listen for Enter key in textareas
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement && (
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true'
        )) {
          const text = activeElement.value || activeElement.textContent;
          if (text && text.length > 10) {
            setTimeout(() => {
              chrome.runtime.sendMessage({
                type: 'TRACK_PROMPT',
                prompt: text.substring(0, 500),
                url: currentUrl
              });
            }, 100);
          }
        }
      }
    });

    // Listen for send button clicks
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (
        target.closest('button[data-testid="send-button"]') ||
        target.closest('button[aria-label*="send" i]') ||
        target.closest('button[aria-label*="submit" i]')
      ) {
        const form = target.closest('form');
        if (form) {
          const textarea = form.querySelector('textarea');
          if (textarea && textarea.value && textarea.value.length > 10) {
            chrome.runtime.sendMessage({
              type: 'TRACK_PROMPT',
              prompt: textarea.value.substring(0, 500),
              url: currentUrl
            });
          }
        }
      }
    });
  }

  // Add ScholarSync indicator
  function addIndicator() {
    // Check if tracking is enabled
    chrome.storage.local.get(['isTracking'], (data) => {
      if (data.isTracking === false) return;

      const indicator = document.createElement('div');
      indicator.id = 'scholarsync-indicator';
      indicator.innerHTML = `
        <div style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          padding: 10px 16px;
          border-radius: 24px;
          font-size: 13px;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
          z-index: 999999;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.95;
          transition: all 0.3s ease;
        " onmouseover="this.style.opacity='1';this.style.transform='scale(1.02)'"
           onmouseout="this.style.opacity='0.95';this.style.transform='scale(1)'">
          <span style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite;"></span>
          <span>ScholarSync</span>
          <span style="font-size: 11px; opacity: 0.8;">tracking</span>
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        </style>
      `;

      indicator.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
      });

      // Auto-hide after 5 seconds
      setTimeout(() => {
        const styledDiv = indicator.firstElementChild;
        if (styledDiv) {
          styledDiv.style.transition = 'opacity 0.5s ease';
          styledDiv.style.opacity = '0';
        }
        setTimeout(() => indicator.remove(), 500);
      }, 5000);

      document.body.appendChild(indicator);
    });
  }

  // Add text selection context features
  function addSelectionFeatures() {
    let tooltip = null;

    document.addEventListener('mouseup', (e) => {
      const selection = window.getSelection().toString().trim();

      // Remove existing tooltip
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }

      // Only show if selection is substantial
      if (selection.length < 20) return;

      // Create tooltip
      tooltip = document.createElement('div');
      tooltip.innerHTML = `
        <div style="
          position: fixed;
          top: ${e.clientY - 50}px;
          left: ${e.clientX}px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 999999;
          display: flex;
          gap: 4px;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        ">
          <button id="ss-analyze" style="
            padding: 6px 10px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            font-weight: 500;
          ">Analyze Prompt</button>
          <button id="ss-grammar" style="
            padding: 6px 10px;
            background: #f1f5f9;
            color: #334155;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            font-weight: 500;
          ">Check Grammar</button>
        </div>
      `;

      document.body.appendChild(tooltip);

      // Add click handlers
      document.getElementById('ss-analyze').addEventListener('click', () => {
        chrome.storage.local.set({ pendingPrompt: selection });
        chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
        tooltip.remove();
      });

      document.getElementById('ss-grammar').addEventListener('click', () => {
        chrome.storage.local.set({ pendingGrammar: selection });
        chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
        tooltip.remove();
      });

      // Remove tooltip on click elsewhere
      setTimeout(() => {
        document.addEventListener('mousedown', function handler(e) {
          if (tooltip && !tooltip.contains(e.target)) {
            tooltip.remove();
            tooltip = null;
            document.removeEventListener('mousedown', handler);
          }
        });
      }, 100);
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupPromptTracking();
      setTimeout(addIndicator, 2000);
      addSelectionFeatures();
    });
  } else {
    setupPromptTracking();
    setTimeout(addIndicator, 2000);
    addSelectionFeatures();
  }
})();
