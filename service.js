/**
 * TabGrid - AI-Powered Tab Grouping Extension
 * Created by Nityam
 * 
 * Intelligently groups browser tabs into clusters using AI
 */
// service.js
console.log("TabGrid by Nityam - service worker loaded");

// Get tabs from the current window (normal or incognito)
async function getNormalWindowTabs() {
  try {
    // Get all windows (including incognito)
    const allWindows = await chrome.windows.getAll();
    
    // Include both normal windows and incognito windows
    const targetWindows = allWindows.filter(w => 
      w.type === 'normal' || w.incognito === true
    );

    if (targetWindows.length === 0) {
      console.warn('No windows found, using all tabs');
      // Simple fallback - just get all tabs
      const allTabs = await chrome.tabs.query({});
      console.log(`Using all ${allTabs.length} tabs (no windows detected)`);
      return allTabs;
    }

    // Use the focused window (normal or incognito), or the first one
    const targetWindow = targetWindows.find(w => w.focused) || targetWindows[0];
    const windowType = targetWindow.incognito ? 'incognito' : 'normal';
    console.log(`Using window ${targetWindow.id} (type: ${windowType})`);

    // Get tabs specifically from this window
    const tabs = await chrome.tabs.query({ windowId: targetWindow.id });
    console.log(`Found ${tabs.length} tabs in ${windowType} window ${targetWindow.id}`);

    return tabs;
  } catch (error) {
    console.error('Error getting window tabs:', error);
    // Simple fallback - just get all tabs (including incognito)
    try {
      const allTabs = await chrome.tabs.query({});
      console.log(`Fallback: using all ${allTabs.length} tabs`);
      return allTabs;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  console.log("TabGrid by Nityam - Extension installed.");
  await updateBadgeBasedOnGroups();
});

// Update badge based on current group state
async function updateBadgeBasedOnGroups() {
  try {
    const groups = await chrome.tabGroups.query({});
    if (groups.length > 0) {
      await updateIconBadge("✓", { color: "#6BCF7F" }); // Show small tick if groups exist
    } else {
      await updateIconBadge(""); // Clear badge if no groups
    }
  } catch (error) {
    console.error("Error updating badge based on groups:", error);
  }
}

// Listen for tab group changes to update badge
chrome.tabGroups.onUpdated.addListener(async () => {
  await updateBadgeBasedOnGroups();
});

chrome.tabGroups.onRemoved.addListener(async () => {
  await updateBadgeBasedOnGroups();
});

// Provider configurations with default API keys (needed for icon click handler)
// ⚠️  REPLACE WITH YOUR OPENROUTER API KEY
const PROVIDER_CONFIGS = {
  openrouter: { defaultKey: "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" }
};

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log("Extension icon clicked");
  
  try {
    // Check if there are any existing tab groups
    const groups = await chrome.tabGroups.query({});
    const hasGroups = groups.length > 0;
    
    if (hasGroups) {
      // Ungroup tabs
      await updateIconBadge("..."); // Show processing indicator
      await handleUngroupTabs();
      await updateIconBadge(""); // Clear immediately after ungrouping
    } else {
      // Group tabs - try AI first, fallback to simple
      await updateIconBadge("AI", { color: "#FFD93D" }); // Yellow for AI processing
      
      try {
        const provider = 'openrouter';
        const apiKey = PROVIDER_CONFIGS[provider].defaultKey;
        await handleGroupTabsAI(provider, apiKey);
        await updateIconBadge("✓", { color: "#6BCF7F" }); // Green for success - stays until ungrouped
      } catch (aiError) {
        console.error("AI grouping failed, trying simple grouping:", aiError);
        // Fallback to simple grouping
        await updateIconBadge("...", { color: "#95A5A6" }); // Gray for fallback
        await handleGroupTabs();
        await updateIconBadge("✓", { color: "#6BCF7F" }); // Green for success - stays until ungrouped
      }
    }
  } catch (error) {
    console.error("Error handling icon click:", error);
    await updateIconBadge("!", { color: "#FF6B6B" }); // Red for error
    setTimeout(() => updateIconBadge(""), 3000); // Clear after 3 seconds
  }
});

// Helper function to update icon badge with visual feedback
async function updateIconBadge(text, options = {}) {
  try {
    await chrome.action.setBadgeText({ text: text });
    if (options.color) {
      await chrome.action.setBadgeBackgroundColor({ color: options.color });
    }
  } catch (error) {
    console.error("Error updating badge:", error);
  }
}

// Listen for keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  console.log("Command received:", command);
  if (command === "toggle-group-tabs") {
    try {
      console.log("Processing toggle-group-tabs command");
      // Check if there are any existing tab groups
      const groups = await chrome.tabGroups.query({});
      const hasGroups = groups.length > 0;
      console.log("Existing groups:", groups.length);
      
      if (hasGroups) {
        // Ungroup tabs
        await updateIconBadge("..."); // Show processing indicator
        await handleUngroupTabs();
        await updateIconBadge(""); // Clear immediately after ungrouping
        console.log("Ungrouped tabs via keyboard shortcut");
      } else {
        // Group tabs - try AI first, fallback to simple (same as icon click)
        await updateIconBadge("AI", { color: "#FFD93D" }); // Yellow for AI processing
        
        try {
          const provider = 'openrouter';
          const apiKey = PROVIDER_CONFIGS[provider].defaultKey;
          await handleGroupTabsAI(provider, apiKey);
          await updateIconBadge("✓", { color: "#6BCF7F" }); // Green for success - stays until ungrouped
        } catch (aiError) {
          console.error("AI grouping failed, trying simple grouping:", aiError);
          // Fallback to simple grouping
          await updateIconBadge("...", { color: "#95A5A6" }); // Gray for fallback
        await handleGroupTabs();
          await updateIconBadge("✓", { color: "#6BCF7F" }); // Green for success - stays until ungrouped
        }
        console.log("Grouped tabs via keyboard shortcut");
      }
    } catch (error) {
      console.error("Error toggling tab groups:", error);
      await updateIconBadge("!", { color: "#FF6B6B" }); // Red for error
      setTimeout(() => updateIconBadge(""), 3000); // Clear after 3 seconds
    }
  }
});

// AI Provider API configurations
const AI_PROVIDERS = {
  openrouter: {
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: "google/gemma-3n-e4b-it:free"
  }
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GROUP_TABS") {
    // Legacy support
    handleGroupTabs()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error("Error in GROUP_TABS:", err);
        sendResponse({ ok: false, error: String(err) });
      });
    return true;
  }

  if (message.type === "GROUP_TABS_AI") {
    handleGroupTabsAI(message.provider, message.apiKey)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error("Error in GROUP_TABS_AI:", err);
        sendResponse({ ok: false, error: String(err) });
      });
    return true;
  }

  if (message.type === "UNGROUP_TABS") {
    handleUngroupTabs()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error("Error in UNGROUP_TABS:", err);
        sendResponse({ ok: false, error: String(err) });
      });
    return true;
  }
});

async function handleGroupTabs() {
  const tabs = await getNormalWindowTabs();

  const simplified = tabs.map((tab) => ({
    id: tab.id,
    index: tab.index, // Preserve index for ordering
    active: tab.active || false, // Preserve active state
    lastAccessed: tab.lastAccessed || 0, // Preserve last accessed time for sorting
    title: tab.title || "",
    url: tab.url || "",
  }));

  const groups = naiveGroupTabs(simplified);

  await applyChromeTabGroups(groups);
}

// Extract base domain (e.g., "google.com" from "mail.google.com")
function getBaseDomain(hostname) {
  if (!hostname) return "unknown";
  
  // Remove www. prefix
  hostname = hostname.replace(/^www\./, '');
  
  // Handle special cases
  if (hostname.startsWith('extension:')) return hostname;
  if (hostname === 'chrome-internal' || hostname === 'about-pages' || hostname === 'edge-internal') {
    return hostname;
  }
  
  // Split by dots and get last 2 parts (domain.tld)
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    // Handle cases like co.uk, com.au
    const tld = parts.slice(-2).join('.');
    // For common multi-part TLDs, take last 3 parts
    if (['co.uk', 'com.au', 'co.jp', 'com.br'].includes(tld) && parts.length >= 3) {
      return parts.slice(-3).join('.');
    }
    return parts.slice(-2).join('.');
  }
  
  return hostname;
}

// Generate a friendly group name from domain
function getGroupNameFromDomain(domain, title) {
  if (!domain || domain === "unknown") {
    return title ? title.substring(0, 30) : "Other";
  }
  
  // Special URL schemes
  if (domain.startsWith('extension:')) {
    return "Chrome Extensions";
  }
  if (domain === 'chrome-internal' || domain === 'edge-internal') {
    return "Browser Internal";
  }
  if (domain === 'about-pages') {
    return "About Pages";
  }
  
  // Extract the main domain name (without TLD) for better naming
  const domainParts = domain.split('.');
  const mainName = domainParts[0];
  
  // Capitalize first letter and make it readable
  const capitalized = mainName.charAt(0).toUpperCase() + mainName.slice(1);
  
  return capitalized;
}

// Smart domain-based grouping (generic, no hardcoding)
function naiveGroupTabs(tabs) {
  const groups = {};

  for (const tab of tabs) {
    if (!tab.url) {
      const key = "No URL";
      if (!groups[key]) groups[key] = [];
      groups[key].push(tab);
      continue;
    }

    const url = tab.url.toLowerCase();
    const host = extractDomain(tab.url).toLowerCase();
    const baseDomain = getBaseDomain(host);
    
    // Use base domain for grouping (groups all subdomains together)
    // e.g., mail.google.com, drive.google.com -> google.com
    let key = getGroupNameFromDomain(baseDomain, tab.title);

    // Handle special URL schemes
    if (url.startsWith('chrome-extension://')) {
      const extMatch = url.match(/chrome-extension:\/\/([^\/]+)/);
      if (extMatch) {
        key = "Chrome Extensions";
      } else {
        key = "Chrome Extensions";
      }
    } else if (url.startsWith('chrome://') || url.startsWith('edge://')) {
      key = "Browser Internal";
    } else if (url.startsWith('about:')) {
      key = "About Pages";
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(tab);
  }

  return groups;
}

async function applyChromeTabGroups(groups) {
  if (!chrome.tabGroups) {
    console.error(
      "tabGroups API is not available. Check Chrome version and permissions."
    );
    return;
  }

  // First, ungroup all tabs to start fresh and preserve order
  try {
    const allTabs = await getNormalWindowTabs();
    const allTabIds = allTabs.map(tab => tab.id).filter(Boolean);
    if (allTabIds.length > 0) {
      await chrome.tabs.ungroup(allTabIds);
      console.log("Ungrouped all tabs to start fresh");
    }
  } catch (error) {
    // Ignore errors - some tabs may not be in groups
    console.log("Some tabs may not be in groups, continuing...");
  }

  // Find the currently active tab across all tabs
  // This ensures the group containing the active tab stays at the end
  const allTabs = Object.values(groups).flat();
  const activeTab = allTabs.find(t => t.active);
  const activeTabId = activeTab?.id;

  // Sort groups by the most recently accessed tab in each group
  // This puts the most recently used groups at the end (right side) of the tab bar
  const sortedGroups = Object.entries(groups).map(([groupName, tabs]) => {
    // Check if this group contains the currently active tab
    const containsActiveTab = tabs.some(t => t.id === activeTabId);
    // Find the most recently accessed tab in this group
    const mostRecentAccess = Math.max(
      ...tabs.map(t => t.lastAccessed || 0),
      0
    );
    // Also keep first tab index as fallback for ordering
    const firstTabIndex = tabs[0]?.index ?? tabs[0]?.id ?? 0;
    
    return { 
      groupName, 
      tabs, 
      mostRecentAccess,
      containsActiveTab,
      firstTabIndex 
    };
  }).sort((a, b) => {
    // Priority: Group containing the active tab goes to the end
    if (a.containsActiveTab && !b.containsActiveTab) {
      return 1; // a goes after b
    }
    if (!a.containsActiveTab && b.containsActiveTab) {
      return -1; // b goes after a
    }
    // Primary sort: by most recent access (most recent = higher timestamp = last)
    if (a.mostRecentAccess !== b.mostRecentAccess) {
      return a.mostRecentAccess - b.mostRecentAccess; // Ascending = oldest first, newest last
    }
    // Secondary sort: by first tab index if access times are equal
    return a.firstTabIndex - b.firstTabIndex;
  });

  // Move tabs to ensure groups are in the correct order (active group at the end)
  // We need to physically reposition tabs so groups appear in the desired order
  let currentIndex = 0;
  for (const { groupName, tabs } of sortedGroups) {
    const tabIds = tabs.map((t) => t.id).filter(Boolean);
    if (!tabIds.length) continue;

    try {
      // Sort tabs within the group by their original index to maintain order
      const sortedTabs = [...tabs].sort((a, b) => (a.index || 0) - (b.index || 0));
      
      // Move each tab to the correct position in sequence
      for (const tab of sortedTabs) {
        try {
          await chrome.tabs.move(tab.id, { index: currentIndex });
          currentIndex++;
        } catch (moveError) {
          console.error(`Failed to move tab ${tab.id}:`, moveError);
          currentIndex++; // Still increment to maintain order
        }
      }

      // Now create the group with the moved tabs
      const sortedTabIds = sortedTabs.map(t => t.id).filter(Boolean);
      
      // Note: Chrome requires at least 2 tabs to create a group
      // If there's only 1 tab, the group() call will fail, but we try anyway
      const groupId = await chrome.tabs.group({ tabIds: sortedTabIds });
      
      // Collapse logic: 
      // - Groups with 2 or fewer tabs are collapsed UNLESS they contain the active tab
      // - Groups with 3+ tabs stay open
      const containsActiveTab = tabs.some(t => t.id === activeTabId);
      const shouldCollapse = tabIds.length <= 2 && !containsActiveTab;
      
      await chrome.tabGroups.update(groupId, {
        title: groupName,
        collapsed: shouldCollapse,
      });
      
      const status = shouldCollapse ? "collapsed" : "open";
      console.log(`Created Chrome tab group "${groupName}" with ${tabIds.length} tabs (${status})`);
    } catch (e) {
      // If grouping fails (e.g., single tab), log but continue
      if (tabIds.length === 1) {
        console.log(`Cannot create group "${groupName}" with only 1 tab (Chrome requires 2+ tabs)`);
      } else {
        console.error(`Failed to create tab group "${groupName}":`, e);
      }
    }
  }
}

// Helper function to format relative time
function formatRelativeTime(timestamp) {
  if (!timestamp) return "unknown";
  
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
}

// Extract domain from URL with proper error handling
function extractDomain(url) {
  if (!url) return "unknown";
  
  try {
    // Handle special Chrome URLs
    if (url.startsWith('chrome-extension://')) {
      const match = url.match(/chrome-extension:\/\/([^\/]+)/);
      return match ? `extension:${match[1]}` : 'chrome-extension';
    }
    if (url.startsWith('chrome://')) {
      return 'chrome-internal';
    }
    if (url.startsWith('about:')) {
      return 'about-pages';
    }
    if (url.startsWith('edge://')) {
      return 'edge-internal';
    }
    
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    // If URL parsing fails, try to extract domain manually
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    return match ? match[1] : "unknown";
  }
}

// AI-powered tab grouping
async function handleGroupTabsAI(provider, apiKey) {
  const tabs = await getNormalWindowTabs();

  // Enhanced tab data with more context
  const simplified = tabs.map((tab) => {
    const domain = extractDomain(tab.url || "");
    const lastAccessed = tab.lastAccessed || 0;
    const relativeTime = formatRelativeTime(lastAccessed);
    
    return {
      id: tab.id,
      index: tab.index, // Preserve index for ordering
      title: tab.title || "",
      url: tab.url || "",
      domain: domain,
      lastAccessed: lastAccessed,
      lastAccessedRelative: relativeTime,
      // Additional metadata that might be useful
      active: tab.active || false,
      pinned: tab.pinned || false,
    };
  });

  try {
    const groups = await aiGroupTabs(simplified, provider, apiKey);
    await applyChromeTabGroups(groups);
  } catch (error) {
    console.error("AI grouping failed, falling back to naive grouping:", error);
    const groups = naiveGroupTabs(simplified);
    await applyChromeTabGroups(groups);
  }
}

// Ungroup all tabs
async function handleUngroupTabs() {
  try {
    const tabs = await getNormalWindowTabs();
    const tabIds = tabs.map(tab => tab.id).filter(Boolean);

    if (tabIds.length > 0) {
      await chrome.tabs.ungroup(tabIds);
      console.log(`Ungrouped ${tabIds.length} tabs`);
    }
  } catch (error) {
    console.error("Error ungrouping tabs:", error);
    throw error;
  }
}

// Call AI API to group tabs
async function aiGroupTabs(tabs, provider, apiKey) {
  const prompt = createGroupingPrompt(tabs);
  const response = await callAIProvider(provider, apiKey, prompt);
  return parseAIGroupingResponse(response, tabs);
}

// Create prompt for AI
function createGroupingPrompt(tabs) {
  const tabList = tabs.map((tab, index) => {
    const domain = extractDomain(tab.url || "");
    const baseDomain = getBaseDomain(domain);
    return `${index + 1}. Title: "${tab.title}" | Domain: ${baseDomain} | URL: ${tab.url}`;
  }).join('\n');

  return `Analyze these browser tabs and group them into logical categories. Group tabs that belong together based on:
- Same website/service (e.g., all discord.com tabs together, all github.com tabs together)
- Related services from the same company (e.g., gmail.com + drive.google.com = "Google Services")
- Similar purpose (e.g., all documentation sites, all social media)
- Related topics (e.g., all tabs about the same project or topic)

Tabs to group:
${tabList}

Grouping Rules:
1. Group tabs from the same base domain together (e.g., discord.com, chat.discord.com → "Discord")
2. Group related services from the same company (e.g., gmail.com, drive.google.com, docs.google.com → "Google Services")
3. Group by purpose when multiple domains serve similar functions (e.g., stackoverflow.com + github.com → "Development Tools")
4. Use clear, concise group names (1-3 words, capitalize properly)
5. Avoid creating groups with only 1 tab unless it's truly unique
6. Maximum 20 groups total
7. Put truly miscellaneous tabs in "Other" or "Miscellaneous"

IMPORTANT: 
- Your response MUST be ONLY valid JSON, no other text
- Use 1-based indices (first tab is 1, not 0)
- Include ALL tabs in your grouping
- Group names should be descriptive (e.g., "Discord", "GitHub", "Google Services", "Documentation", "Social Media")

Return format (JSON only):
{"Group Name 1": [1, 3, 5], "Group Name 2": [2, 4], "Miscellaneous": [6]}`;
}

// Test API key validity and debug
async function testApiKey(provider, apiKey) {
  const config = AI_PROVIDERS[provider];
  if (!config) return false;

  try {
    console.log(`Testing API key for ${provider}...`);
    console.log(`Using endpoint: ${config.endpoint}`);
    console.log(`Using model: ${config.model}`);
    console.log(`API key starts with: ${apiKey.substring(0, 10)}...`);

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    const testBody = {
      model: config.model,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10
    };


    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(testBody)
    });

    console.log(`Test response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
    }

    return response.status !== 401 && response.status !== 402 && response.status !== 404;
  } catch (error) {
    console.error(`API key test failed for ${provider}:`, error);
    return false;
  }
}

// Call AI provider API
async function callAIProvider(provider, apiKey, prompt) {
  const config = AI_PROVIDERS[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  // Check for placeholder API keys
  if (apiKey.includes('YOUR_') || apiKey.length < 10) {
    throw new Error(`Invalid API key for ${provider}. Please check your API key configuration.`);
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  const requestBody = {
    model: config.model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
    temperature: 0.3
  };

  console.log(`Calling ${provider} API at ${config.endpoint}`);

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorMessage = `API call failed: ${response.status} ${response.statusText}`;

    // Add specific guidance for common errors
    if (response.status === 401) {
      errorMessage += ' - Invalid API key. Please check your API key.';
    } else if (response.status === 402) {
      errorMessage += ' - Payment required. Check your account balance/credits.';
    } else if (response.status === 429) {
      errorMessage += ' - Rate limit exceeded. Please try again later.';
    } else if (response.status === 403) {
      errorMessage += ' - Access forbidden. Check API key permissions.';
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log(`API response from ${provider}:`, data);
  return extractResponseText(data, provider);
}

// Extract text from API response
function extractResponseText(data, provider) {
  // All supported providers use OpenAI-compatible response format
  return data.choices?.[0]?.message?.content || '';
}

// Parse AI response into groups
function parseAIGroupingResponse(responseText, tabs) {
  try {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const groupsData = JSON.parse(jsonMatch[0]);

    // Convert indices back to tabs
    const groups = {};
    for (const [groupName, indices] of Object.entries(groupsData)) {
      const groupTabs = indices.map(index => tabs[index - 1]).filter(Boolean);
      if (groupTabs.length > 0) {
        groups[groupName] = groupTabs;
      }
    }

    return groups;
  } catch (error) {
    console.error('Failed to parse AI response:', error, responseText);
    throw new Error('Failed to parse AI grouping response');
  }
}
