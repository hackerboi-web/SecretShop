"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReady = handleReady;
const index_js_1 = require("../index.js");
async function handleReady() {
    console.log(`[Bot] Ready! Logged in as ${index_js_1.client.user?.tag}`);
    // Set activity
    index_js_1.client.user?.setActivity('Secret Shop Economy', { type: 3 });
    // Post/repost panels
    console.log('[Bot] Posting panels...');
    await index_js_1.panelManager.repostAllPanels();
    console.log('[Bot] Panels posted');
    // Start periodic panel refresh (every 30 min)
    setInterval(async () => {
        try {
            await index_js_1.panelManager.repostAllPanels();
        }
        catch (e) {
            console.error('[Bot] Panel refresh failed:', e);
        }
    }, 30 * 60 * 1000);
}
//# sourceMappingURL=ready.js.map