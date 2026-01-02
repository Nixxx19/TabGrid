<p align="center">
  <img width="128" height="128" alt="boxes1" src="https://github.com/user-attachments/assets/43a8a181-9a04-40d7-8e9f-5350819ade63" />
</p>

# TabGrid

🧩 **Intelligently organize your browser tabs into a clean grid using AI**

TabGrid is a Chrome extension that automatically groups your open tabs into logical clusters, organizing them into a clean, manageable grid. Whether you're working on multiple projects, browsing different topics, or juggling various services, TabGrid helps you keep your browser tidy and organized.

## ✨ Features

- **AI-Powered Grouping**: Uses AI (via OpenRouter) to intelligently analyze and group tabs based on content, purpose, and relationships
- **Smart Fallback**: Automatically falls back to domain-based grouping if AI is unavailable
- **One-Click Toggle**: Click the extension icon or use `Ctrl+Shift+X` (Mac: `Cmd+Shift+X`) to group or ungroup tabs
- **Visual Feedback**: Green checkmark badge indicates when tabs are grouped
- **Smart Collapse**: Groups with 2 or fewer tabs automatically collapse (unless they contain the active tab)
- **Incognito Support**: Works seamlessly in both normal and incognito windows
- **Automatic Organization**: Groups tabs by domain, related services, and similar purposes

## 🎬 Demo

### Visual Comparison

See TabGrid in action! Watch how it transforms a cluttered browser into an organized workspace.

**Before:** Multiple unorganized tabs cluttering your browser
- Hard to find specific tabs
- No logical grouping
- Overwhelming tab bar

<img width="1440" height="166" alt="Screenshot 2026-01-02 at 4 11 43 PM" src="https://github.com/user-attachments/assets/ba310feb-0f0f-4f17-bcf0-030806448be4" />

---

**After:** Tabs organized into logical groups
- Clean, organized tab groups
- Easy to find related tabs
- Collapsed groups save space

<img width="1440" height="165" alt="Screenshot 2026-01-02 at 3 55 16 PM" src="https://github.com/user-attachments/assets/6735f030-e901-46fe-8062-0cc067e8cc6e" />


## How It Works

1. **Click the TabGrid icon** or press `Ctrl+Shift+X` (Mac: `Cmd+Shift+X`)
2. Watch as your tabs are automatically grouped by:
   - **Same website** (e.g., all GitHub tabs together)
   - **Related services** (e.g., Gmail + Google Drive = "Google Services")
   - **Similar purpose** (e.g., documentation sites, social media)
   - **Related topics** (e.g., project-specific tabs)
3. **Click again** to ungroup all tabs instantly

> 💡 **Tip**: Groups with 2 or fewer tabs automatically collapse to keep your tab bar clean!

## 🚀 Installation

### Method 1: Load Unpacked Extension (Recommended)

1. **Download the Extension**
   - Clone this repository or download the ZIP file
   - Extract the files to a folder on your computer

2. **Enable Developer Mode in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Toggle "Developer mode" ON (top right corner)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing `manifest.json`
   - The extension should now appear in your extensions list

4. **Verify Installation**
   - Look for the TabGrid icon in your Chrome toolbar
   - You should see a checkmark badge when tabs are grouped

### Method 2: Package as .crx (Optional)

If you want to create a packaged extension file:

1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Click "Pack extension"
4. Select the extension directory
5. This creates a `.crx` file you can share

## ⌨️ Usage

### Keyboard Shortcut
- **Windows/Linux**: `Ctrl+Shift+X`
- **Mac**: `Cmd+Shift+X`

### Manual Activation
- Click the TabGrid icon in your Chrome toolbar

### How It Works

1. **Grouping Tabs**: Click the icon or press the keyboard shortcut
   - The extension analyzes all open tabs
   - Groups them intelligently using AI (or domain-based fallback)
   - Creates Chrome tab groups with descriptive names

2. **Ungrouping Tabs**: Click the icon or press the keyboard shortcut again
   - All tab groups are removed
   - Tabs return to their ungrouped state

3. **Visual Indicators**
   - **Green checkmark (✓)**: Tabs are currently grouped
   - **No badge**: Tabs are ungrouped
   - **Yellow "AI" badge**: AI grouping in progress
   - **Red "!" badge**: Error occurred

## 🔧 Configuration

### AI-Powered Grouping

The extension uses OpenRouter for AI-powered grouping. **An API key is already configured** - the extension works out of the box!

**Optional: Use Your Own API Key**

If you want to use your own OpenRouter API key instead:

1. Get an API key from [OpenRouter](https://openrouter.ai)
2. Open `service.js` in a text editor
3. Find the `PROVIDER_CONFIGS` section (around line 83)
4. Replace the API key with your own:
   ```javascript
   const PROVIDER_CONFIGS = {
     openrouter: { defaultKey: "YOUR_API_KEY_HERE" }
   };
   ```

**Note**: The extension works perfectly fine with the default API key - no configuration needed! It will automatically use intelligent domain-based grouping as a fallback if AI is unavailable.

## 📦 Permissions

- `tabs`: To read and organize your tabs
- `tabGroups`: To create and manage tab groups
- `storage`: To save extension settings
- `<all_urls>`: To analyze tab content for grouping
- `https://openrouter.ai/*`: To access OpenRouter AI API (if using AI features)

## 🛠️ Built With

- Chrome Extensions Manifest V3
- Chrome Tab Groups API
- OpenRouter AI API (optional)

## 📝 How Tab Grouping Works

TabGrid groups tabs based on:

- **Same website/service**: All tabs from the same domain (e.g., all discord.com tabs together)
- **Related services**: Services from the same company (e.g., gmail.com + drive.google.com = "Google")
- **Similar purpose**: Tabs serving similar functions (e.g., documentation sites, social media)
- **Related topics**: Tabs about the same project or topic

## 🐛 Troubleshooting

### Extension not working?
- Make sure Developer mode is enabled
- Check that Chrome version is 89+ (required for Tab Groups API)
- Reload the extension from `chrome://extensions/`

### AI grouping not working?
- Verify your OpenRouter API key is correct
- Check your internet connection
- The extension will automatically fall back to domain-based grouping

### Badge not showing?
- The badge only appears when tabs are grouped
- Try grouping your tabs again
- Check the browser console for errors

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📌 Requirements

- Chrome 89+ (for Tab Groups API support)
- Developer mode enabled (for unpacked extensions)

---

**Note**: This extension requires Chrome 89+ for Tab Groups API support. Make sure your Chrome browser is up to date.

