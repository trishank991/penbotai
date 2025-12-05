// PenBotAI Chrome Extension - Full Featured Popup with API Integration

// ==================== Configuration ====================
// Detect environment - use production URL unless explicitly in development
// Note: Chrome Web Store extensions have update_url set by Chrome, but unpacked
// extensions loaded via "Load unpacked" do not have update_url.
// For production builds, set SCHOLARSYNC_ENV in your build process or use a
// bundler to replace this value at build time.
const API_BASE = (() => {
  // Check for build-time environment variable (set during production build)
  // eslint-disable-next-line no-undef
  if (typeof PENBOTAI_ENV !== 'undefined' && PENBOTAI_ENV === 'production') {
    return 'https://penbotai.com';
  }

  // For Chrome extensions, check if running as unpacked (development)
  if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
    const manifest = chrome.runtime.getManifest();
    // Unpacked extensions don't have update_url; store extensions do
    // Also check for explicit development key in manifest
    if (!manifest.update_url && !manifest.key) {
      return 'http://localhost:3000';
    }
  }
  return 'https://penbotai.com';
})();
const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1';

// ==================== State Management ====================
let state = {
  selectedTools: [],
  isTracking: true,
  sessions: [],
  user: null,
  isAuthenticated: false,
  useOfflineMode: false,
};

// ==================== Authentication ====================
async function checkAuth() {
  const data = await chrome.storage.local.get(['authToken', 'user', 'useOfflineMode']);

  // Check if user chose offline mode previously
  if (data.useOfflineMode) {
    state.useOfflineMode = true;
    state.isAuthenticated = false;
    updateAuthUI();
    return false;
  }

  // If we have stored auth, use it
  if (data.authToken && data.user) {
    state.user = data.user;
    state.isAuthenticated = true;
    state.useOfflineMode = false;
    updateAuthUI();
    return true;
  }

  // Try to check auth via API (for cookie-based auth)
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include'
    });
    const authData = await response.json();

    if (authData.authenticated && authData.user) {
      state.user = authData.user;
      state.isAuthenticated = true;
      state.useOfflineMode = false;
      // Cache the auth state
      await chrome.storage.local.set({
        user: authData.user,
        authToken: 'session',
        useOfflineMode: false
      });
      updateAuthUI();
      return true;
    }
  } catch (error) {
    console.log('API auth check failed, showing auth screen');
  }

  // Not authenticated - show auth section
  state.isAuthenticated = false;
  state.useOfflineMode = false;
  updateAuthUI();
  return false;
}

function updateAuthUI() {
  const authSection = document.getElementById('authSection');
  const mainContent = document.getElementById('mainContent');
  const planBadge = document.getElementById('planBadge');
  const offlineIndicator = document.getElementById('offlineIndicator');
  const logoutBtn = document.getElementById('logoutBtn');

  if (state.isAuthenticated) {
    // User is logged in
    if (authSection) authSection.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (planBadge) {
      planBadge.textContent = state.user?.plan === 'premium' ? 'Premium' : 'Free';
      planBadge.style.background = state.user?.plan === 'premium' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(255,255,255,0.2)';
    }
    if (offlineIndicator) {
      offlineIndicator.classList.remove('visible');
    }
  } else if (state.useOfflineMode) {
    // Offline mode - show main content but with offline indicator
    if (authSection) authSection.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (offlineIndicator) offlineIndicator.classList.add('visible');
    if (planBadge) planBadge.textContent = 'Offline';
  } else {
    // Not authenticated - show auth section
    if (authSection) authSection.classList.remove('hidden');
    if (mainContent) mainContent.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (offlineIndicator) offlineIndicator.classList.remove('visible');
    if (planBadge) planBadge.textContent = 'Free';
  }
}

// ==================== Tab Navigation ====================
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const tabName = tab.dataset.tab;
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`${tabName}-panel`).classList.add('active');
  });
});

// ==================== API Wrapper ====================
async function callAPI(endpoint, method = 'GET', body = null) {
  if (state.useOfflineMode) {
    throw new Error('Offline mode - using local analysis');
  }

  const headers = { 'Content-Type': 'application/json' };
  const options = { method, headers, credentials: 'include' };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'API request failed');
  }

  return response.json();
}

// ==================== Research Assistant ====================
document.getElementById('searchBtn').addEventListener('click', searchPapers);
document.getElementById('researchQuery').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchPapers();
});

async function searchPapers() {
  const query = document.getElementById('researchQuery').value.trim();
  if (query.length < 3) return;

  const resultsDiv = document.getElementById('researchResults');
  resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Searching papers...</div>';

  try {
    const fields = 'paperId,title,abstract,year,authors,citationCount,url,openAccessPdf,externalIds';
    const response = await fetch(
      `${SEMANTIC_SCHOLAR_API}/paper/search?query=${encodeURIComponent(query)}&limit=10&fields=${fields}`
    );

    if (!response.ok) throw new Error('Search failed');

    const data = await response.json();
    const papers = data.data || [];

    if (papers.length === 0) {
      resultsDiv.innerHTML = `
        <div class="empty-state">
          <div class="icon">🔍</div>
          <p>No papers found for "${escapeHtml(query)}"</p>
        </div>
      `;
      return;
    }

    resultsDiv.innerHTML = papers.map(paper => {
      const authors = (paper.authors || []).slice(0, 2).map(a => a.name).join(', ');
      const authorStr = paper.authors?.length > 2 ? authors + ' et al.' : authors;
      const year = paper.year || 'n.d.';
      const citations = generateCitations(paper);

      return `
        <div class="paper-card">
          <div class="paper-title">${escapeHtml(paper.title)}</div>
          <div class="paper-meta">${escapeHtml(authorStr)} (${year}) • ${paper.citationCount || 0} citations</div>
          <div class="paper-actions">
            <button class="citation-btn" onclick="copyCitation('${escapeJs(citations.apa)}', this)">APA</button>
            <button class="citation-btn" onclick="copyCitation('${escapeJs(citations.mla)}', this)">MLA</button>
            <button class="citation-btn" onclick="copyCitation('${escapeJs(citations.chicago)}', this)">Chicago</button>
            <button class="citation-btn" onclick="copyCitation('${escapeJs(citations.bibtex)}', this)">BibTeX</button>
            ${paper.openAccessPdf?.url ? `<a href="${paper.openAccessPdf.url}" target="_blank" class="citation-btn" style="text-decoration:none;">PDF</a>` : ''}
            <a href="${paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`}" target="_blank" class="citation-btn" style="text-decoration:none;">View</a>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    resultsDiv.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <p>Search failed. Please try again.</p>
      </div>
    `;
  }
}

function generateCitations(paper) {
  const authors = paper.authors || [];
  const year = paper.year || 'n.d.';
  const title = paper.title || 'Untitled';

  let apaAuthors = authors.slice(0, 7).map((a, i) => {
    const parts = a.name.split(' ');
    const lastName = parts.pop() || '';
    const initials = parts.map(p => p[0] + '.').join(' ');
    return i === authors.length - 1 && authors.length > 1
      ? `& ${lastName}, ${initials}`
      : `${lastName}, ${initials}`;
  }).join(', ');
  if (authors.length > 7) apaAuthors += ', et al.';
  const apa = `${apaAuthors} (${year}). ${title}.`;

  const firstAuthor = authors[0];
  let mlaAuthors = '';
  if (firstAuthor) {
    const parts = firstAuthor.name.split(' ');
    const lastName = parts.pop() || '';
    mlaAuthors = `${lastName}, ${parts.join(' ')}`;
    if (authors.length === 2) mlaAuthors += `, and ${authors[1].name}`;
    else if (authors.length > 2) mlaAuthors += ', et al.';
  }
  const mla = `${mlaAuthors}. "${title}." ${year}.`;

  let chicagoAuthors = authors.slice(0, 3).map((a, i) => {
    if (i === 0) {
      const parts = a.name.split(' ');
      const lastName = parts.pop() || '';
      return `${lastName}, ${parts.join(' ')}`;
    }
    return a.name;
  }).join(', ');
  if (authors.length > 3) chicagoAuthors += ', et al.';
  const chicago = `${chicagoAuthors}. "${title}." ${year}.`;

  const key = ((authors[0]?.name.split(' ').pop()?.toLowerCase() || 'unknown')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, '')) + year;
  const bibtex = `@article{${key},
  author = {${authors.map(a => a.name).join(' and ')}},
  title = {${title}},
  year = {${year}}
}`;

  return { apa, mla, chicago, bibtex };
}

window.copyCitation = function(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('copied');
    }, 1500);
  });
};

// ==================== AI Disclosure Generator ====================
document.querySelectorAll('#aiToolsChips .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('selected');
    const tool = chip.dataset.tool;
    if (chip.classList.contains('selected')) {
      state.selectedTools.push(tool);
    } else {
      state.selectedTools = state.selectedTools.filter(t => t !== tool);
    }
  });
});

document.getElementById('generateDisclosure').addEventListener('click', generateDisclosure);

async function generateDisclosure() {
  const assignmentType = document.getElementById('assignmentType').value;
  const usage = document.getElementById('usageDescription').value.trim();
  const template = document.getElementById('disclosureTemplate')?.value || 'generic';
  const resultDiv = document.getElementById('disclosureResult');
  const btn = document.getElementById('generateDisclosure');

  if (!assignmentType) {
    showNotification('Please select an assignment type', 'error');
    return;
  }

  if (state.selectedTools.length === 0) {
    showNotification('Please select at least one AI tool', 'error');
    return;
  }

  if (!usage) {
    showNotification('Please describe how you used AI', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Generating...';

  try {
    let disclosure;

    if (state.isAuthenticated && !state.useOfflineMode) {
      try {
        const response = await callAPI('/api/disclosure', 'POST', {
          aiTools: state.selectedTools,
          purpose: assignmentType,
          description: usage,
          outputUsage: 'included in assignment',
          template: template,
        });
        disclosure = response.disclosure;
      } catch (apiError) {
        console.log('API failed, using offline generation:', apiError.message);
        disclosure = generateDisclosureOffline(assignmentType, usage, template);
      }
    } else {
      disclosure = generateDisclosureOffline(assignmentType, usage, template);
    }

    resultDiv.style.display = 'block';
    resultDiv.textContent = disclosure;

    chrome.storage.local.get(['disclosures'], (data) => {
      const disclosures = data.disclosures || [];
      disclosures.unshift({
        type: assignmentType,
        tools: state.selectedTools,
        usage,
        disclosure,
        timestamp: new Date().toISOString(),
        synced: state.isAuthenticated && !state.useOfflineMode
      });
      chrome.storage.local.set({ disclosures: disclosures.slice(0, 50) });
    });

  } catch (error) {
    showNotification(error.message || 'Failed to generate disclosure', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate Disclosure';
  }
}

function generateDisclosureOffline(assignmentType, usage, template) {
  const tools = state.selectedTools.join(', ');
  const date = new Date().toLocaleDateString();

  const templates = {
    generic: `AI Usage Disclosure Statement

Assignment Type: ${assignmentType}
AI Tools Used: ${tools}
Date: ${date}

Description of Use:
${usage}

I acknowledge that I have used the above-mentioned AI tools in the preparation of this ${assignmentType.toLowerCase()}. The AI assistance was used as described above, and I take full responsibility for the final content submitted.

Generated by PenBotAI (Offline Mode)`,

    apa: `AI Disclosure (APA Style)

In the preparation of this ${assignmentType.toLowerCase()}, the following AI tools were utilized: ${tools}.

The AI assistance was employed for: ${usage}

All AI-generated content has been reviewed for accuracy. The author takes full responsibility for the final submission.

Reference: PenBotAI. (${new Date().getFullYear()}). AI Disclosure Generator [Computer software]. https://penbotai.com`,

    mla: `AI Usage Statement (MLA Format)

This ${assignmentType.toLowerCase()} was prepared with assistance from the following artificial intelligence tools: ${tools}.

Purpose and Scope of AI Use:
${usage}

The author has reviewed and verified all AI-assisted content and assumes full responsibility for the submitted work.

Works Cited Entry: PenBotAI. AI Disclosure Generator, ${new Date().getFullYear()}, penbotai.com.`
  };

  return templates[template] || templates.generic;
}

// ==================== Prompt Coach ====================
document.getElementById('analyzePrompt').addEventListener('click', analyzePrompt);

async function analyzePrompt() {
  const prompt = document.getElementById('promptText').value.trim();
  const resultDiv = document.getElementById('promptResult');
  const btn = document.getElementById('analyzePrompt');

  if (prompt.length < 10) {
    showNotification('Please enter at least 10 characters', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Analyzing...';

  try {
    let analysis;

    if (state.isAuthenticated && !state.useOfflineMode) {
      try {
        const response = await callAPI('/api/prompt-coach', 'POST', {
          prompt: prompt,
          targetModel: 'general'
        });
        analysis = {
          score: response.score,
          feedback: response.feedback || getFeedbackForScore(response.score),
          suggestions: response.suggestions || []
        };
      } catch (apiError) {
        console.log('API failed, using offline analysis:', apiError.message);
        analysis = scorePromptOffline(prompt);
      }
    } else {
      analysis = scorePromptOffline(prompt);
    }

    const scoreCircle = document.getElementById('promptScoreCircle');
    const scoreColor = analysis.score >= 80 ? '#22c55e' : analysis.score >= 60 ? '#eab308' : '#ef4444';
    scoreCircle.style.borderColor = scoreColor;
    document.getElementById('promptScore').textContent = analysis.score;
    document.getElementById('promptScore').style.color = scoreColor;
    document.getElementById('promptFeedback').textContent = analysis.feedback;

    document.getElementById('promptSuggestions').innerHTML = analysis.suggestions
      .map(s => `<li>${escapeHtml(s)}</li>`)
      .join('');

    resultDiv.style.display = 'block';

    chrome.storage.local.get(['prompts'], (data) => {
      const prompts = data.prompts || [];
      prompts.unshift({
        text: prompt,
        score: analysis.score,
        timestamp: new Date().toISOString(),
        synced: state.isAuthenticated && !state.useOfflineMode
      });
      chrome.storage.local.set({ prompts: prompts.slice(0, 100) });
    });

  } catch (error) {
    showNotification(error.message || 'Failed to analyze prompt', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Analyze Prompt';
  }
}

function getFeedbackForScore(score) {
  if (score >= 80) return 'Excellent prompt! Well-structured with clear context.';
  if (score >= 60) return 'Good prompt with room for improvement.';
  if (score >= 40) return 'Fair prompt. Consider the suggestions below.';
  return 'This prompt needs more detail and structure.';
}

function scorePromptOffline(prompt) {
  let score = 50;
  const suggestions = [];

  if (prompt.length < 50) {
    score -= 15;
    suggestions.push('Add more detail - prompts under 50 characters often lack context');
  } else if (prompt.length > 200) {
    score += 10;
  }

  if (/context|background|situation/i.test(prompt)) {
    score += 10;
  } else {
    suggestions.push('Consider adding context or background information');
  }

  if (/specific|exactly|precisely|detailed/i.test(prompt)) {
    score += 10;
  } else {
    suggestions.push('Be more specific about what you need');
  }

  if (/format|structure|style|list|bullet|step/i.test(prompt)) {
    score += 10;
  } else {
    suggestions.push('Specify the desired output format (list, paragraph, etc.)');
  }

  if (/example|like|such as|for instance/i.test(prompt)) {
    score += 10;
  } else {
    suggestions.push('Include examples of what you\'re looking for');
  }

  if (/avoid|don't|without|limit|maximum|minimum/i.test(prompt)) {
    score += 5;
  } else {
    suggestions.push('Add constraints (what to avoid, length limits, etc.)');
  }

  if (/audience|reader|for|target/i.test(prompt)) {
    score += 5;
  }

  if (prompt.includes('?')) {
    score += 5;
  }

  score = Math.min(100, Math.max(0, score));

  return { score, feedback: getFeedbackForScore(score), suggestions: suggestions.slice(0, 5) };
}

// ==================== Grammar Checker ====================
document.getElementById('checkGrammar').addEventListener('click', checkGrammar);

async function checkGrammar() {
  const text = document.getElementById('grammarText').value.trim();
  const resultDiv = document.getElementById('grammarResult');
  const btn = document.getElementById('checkGrammar');

  if (text.length < 5) {
    showNotification('Please enter some text to check', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Checking...';

  try {
    let result;

    if (state.isAuthenticated && !state.useOfflineMode) {
      try {
        const response = await callAPI('/api/grammar', 'POST', { text });
        result = {
          score: Math.max(0, 100 - (response.matches?.length || 0) * 5),
          wordCount: response.stats?.wordCount || text.split(/\s+/).length,
          issues: (response.matches || []).map(m => ({
            type: m.rule?.category || 'grammar',
            severity: 'error',
            message: m.message,
            suggestion: m.replacements?.[0] || ''
          }))
        };
      } catch (apiError) {
        console.log('API failed, using offline analysis:', apiError.message);
        result = analyzeGrammarOffline(text);
      }
    } else {
      result = analyzeGrammarOffline(text);
    }

    document.getElementById('grammarScore').textContent = result.score;
    document.getElementById('wordCount').textContent = result.wordCount;
    document.getElementById('issueCount').textContent = result.issues.length;

    const issuesDiv = document.getElementById('grammarIssues');
    if (result.issues.length === 0) {
      issuesDiv.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No issues found!</p></div>';
    } else {
      issuesDiv.innerHTML = result.issues.slice(0, 10).map(issue => `
        <div class="issue-item ${issue.severity}">
          <div class="issue-type ${issue.severity}">${escapeHtml(issue.type)}</div>
          <div>${escapeHtml(issue.message)}</div>
          ${issue.suggestion ? `<div style="margin-top:4px;color:#3b82f6;font-size:11px;">Suggestion: ${escapeHtml(issue.suggestion)}</div>` : ''}
        </div>
      `).join('');
    }

    resultDiv.style.display = 'block';

  } catch (error) {
    showNotification(error.message || 'Failed to check grammar', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Check Grammar';
  }
}

function analyzeGrammarOffline(text) {
  const issues = [];
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  const spellingMistakes = {
    'recieve': 'receive', 'seperate': 'separate', 'occured': 'occurred',
    'definately': 'definitely', 'accomodate': 'accommodate', 'acheive': 'achieve',
    'alot': 'a lot', 'untill': 'until', 'wierd': 'weird', 'truely': 'truly',
    'begining': 'beginning', 'beleive': 'believe', 'calender': 'calendar'
  };

  for (const [wrong, correct] of Object.entries(spellingMistakes)) {
    if (text.toLowerCase().includes(wrong)) {
      issues.push({
        type: 'spelling',
        severity: 'error',
        message: `"${wrong}" may be misspelled`,
        suggestion: correct
      });
    }
  }

  if (text.match(/\b(\w+)\s+\1\b/gi)) {
    issues.push({
      type: 'grammar',
      severity: 'error',
      message: 'Repeated word detected',
      suggestion: 'Remove duplicate word'
    });
  }

  if (/\s{2,}/.test(text)) {
    issues.push({
      type: 'punctuation',
      severity: 'warning',
      message: 'Multiple consecutive spaces detected',
      suggestion: 'Use single spaces'
    });
  }

  if (text.length > 20 && !/[.!?]$/.test(text.trim())) {
    issues.push({
      type: 'punctuation',
      severity: 'warning',
      message: 'Missing punctuation at end of text',
      suggestion: 'Add period, question mark, or exclamation point'
    });
  }

  if (/\b(was|were|is|are|been|being)\s+(written|done|made|given|taken)\b/i.test(text)) {
    issues.push({
      type: 'style',
      severity: 'suggestion',
      message: 'Consider using active voice',
      suggestion: 'Restructure to make the subject perform the action'
    });
  }

  const wordyPhrases = [
    { phrase: 'in order to', suggestion: 'to' },
    { phrase: 'due to the fact that', suggestion: 'because' },
    { phrase: 'at this point in time', suggestion: 'now' }
  ];

  for (const { phrase, suggestion } of wordyPhrases) {
    if (text.toLowerCase().includes(phrase)) {
      issues.push({
        type: 'style',
        severity: 'suggestion',
        message: `"${phrase}" could be simplified`,
        suggestion: suggestion
      });
    }
  }

  const errorPenalty = issues.filter(i => i.severity === 'error').length * 5;
  const warningPenalty = issues.filter(i => i.severity === 'warning').length * 2;
  const suggestionPenalty = issues.filter(i => i.severity === 'suggestion').length * 1;
  const score = Math.max(0, Math.min(100, 100 - errorPenalty - warningPenalty - suggestionPenalty));

  return { score, wordCount, issues };
}

// ==================== AI Usage Tracking ====================
async function loadTrackingData() {
  chrome.storage.local.get(['sessions', 'isTracking', 'prompts'], (data) => {
    state.sessions = data.sessions || [];
    state.isTracking = data.isTracking !== false;

    const dot = document.getElementById('trackingDot');
    const text = document.getElementById('trackingText');
    const btn = document.getElementById('toggleTracking');

    if (state.isTracking) {
      dot.classList.remove('inactive');
      text.textContent = 'Tracking Active';
      btn.textContent = 'Pause';
    } else {
      dot.classList.add('inactive');
      text.textContent = 'Tracking Paused';
      btn.textContent = 'Resume';
    }

    const today = new Date().toDateString();
    const todaySessions = state.sessions.filter(s =>
      new Date(s.timestamp).toDateString() === today
    );

    document.getElementById('todaySessions').textContent = todaySessions.length;
    document.getElementById('totalPrompts').textContent = (data.prompts || []).length;

    const uniqueTools = new Set(state.sessions.map(s => s.tool));
    document.getElementById('totalTools').textContent = uniqueTools.size;

    const recentDiv = document.getElementById('recentActivity');
    if (state.sessions.length === 0) {
      recentDiv.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No activity recorded yet</p></div>';
    } else {
      recentDiv.innerHTML = state.sessions.slice(0, 5).map(session => {
        const time = new Date(session.timestamp).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        });
        return `
          <div style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:12px;">
            <strong>${escapeHtml(session.tool)}</strong>
            <span style="color:#64748b;float:right;">${time}</span>
          </div>
        `;
      }).join('');
    }
  });
}

document.getElementById('toggleTracking').addEventListener('click', () => {
  state.isTracking = !state.isTracking;
  chrome.storage.local.set({ isTracking: state.isTracking }, loadTrackingData);
});

// ==================== Utility Functions ====================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeJs(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    z-index: 1000;
    ${type === 'error' ? 'background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;' :
      type === 'success' ? 'background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0;' :
      'background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;'}
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}

// ==================== Auth Event Handlers ====================
document.getElementById('loginBtn')?.addEventListener('click', () => {
  chrome.tabs.create({ url: `${API_BASE}/login?extension=true` });
});

document.getElementById('continueOffline')?.addEventListener('click', () => {
  state.useOfflineMode = true;
  state.isAuthenticated = false;
  chrome.storage.local.set({ useOfflineMode: true });
  updateAuthUI();
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await chrome.storage.local.remove(['authToken', 'user']);
  state.user = null;
  state.isAuthenticated = false;
  state.useOfflineMode = true;
  updateAuthUI();
});

// Listen for auth messages from web app
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate sender is from our app using proper URL parsing
  // Using .startsWith() is vulnerable to bypass (e.g., https://penbotai.com.evil.com)
  const allowedOrigins = ['http://localhost:3000', 'https://penbotai.com'];
  if (!sender.url) {
    return;
  }
  try {
    const senderOrigin = new URL(sender.url).origin;
    if (!allowedOrigins.includes(senderOrigin)) {
      return;
    }
  } catch {
    return;
  }

  if (message.type === 'AUTH_SUCCESS') {
    state.user = message.user;
    state.isAuthenticated = true;
    state.useOfflineMode = false;
    chrome.storage.local.set({
      authToken: message.token,
      user: message.user,
      useOfflineMode: false
    });
    updateAuthUI();
    sendResponse({ success: true });
  }
});

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  loadTrackingData();
});
