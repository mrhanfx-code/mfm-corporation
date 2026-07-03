// MFM Corporation - CEO Remy Status Check System
// Real-time status monitoring for all agents and teams

// Wait for DOM to be ready before setting up status checks
document.addEventListener('DOMContentLoaded', () => {
    // CEO Remy Status Check Function
    window.checkAllAgentStatus = async function() {
        // Check Cloudflare API status first
        let apiStatus = null;
        try {
            const response = await fetch(`${window.CLOUDFLARE_CONFIG.apiUrl}${window.CLOUDFLARE_CONFIG.endpoints.status}`);
            if (response.ok) {
                apiStatus = await response.json();
            }
        } catch (error) {
            console.log('API status check failed:', error);
        }
        
        // Check local system status
        const localStatus = window.corporateChat ? window.corporateChat.checkAllAgentStatus() : {
            teams: 'unknown',
            executives: 'unknown',
            system: 'unknown',
            database: 'unknown',
            authentication: 'unknown'
        };
        
        // Display status in console for debugging
        console.log('=== MFM CORPORATION STATUS CHECK ===');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Cloudflare API:', apiStatus);
        console.log('Local System:', localStatus);
        console.log('=====================================');
        
        // Return combined status
        return {
            cloudflare: apiStatus,
            local: localStatus,
            timestamp: new Date().toISOString()
        };
    };

    // Auto-update status every 30 seconds
    setInterval(() => {
        if (window.corporateChat && window.corporateChat.checkAllAgentStatus) {
            window.corporateChat.checkAllAgentStatus();
        }
    }, 30000);

    // Manual status check - can be called from browser console
    window.manualStatusCheck = function() {
        console.log('Manual status check triggered');
        return window.corporateChat.checkAllAgentStatus();
    };
});
