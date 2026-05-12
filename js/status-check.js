// MFM Corporation - CEO Remy Status Check System
// Real-time status monitoring for all agents and teams

// CEO Remy Status Check Function
window.checkAllAgentStatus = function() {
    const status = window.corporateChat.checkAllAgentStatus();
    
    // Display status in console for debugging
    console.log('=== MFM CORPORATION STATUS CHECK ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Teams:', status.teams);
    console.log('Executives:', status.executives);
    console.log('System:', status.system);
    console.log('Database:', status.database);
    console.log('Authentication:', status.authentication);
    console.log('=====================================');
    
    // Return formatted status for user
    return status;
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
