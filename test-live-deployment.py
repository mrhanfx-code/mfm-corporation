from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    # Navigate to live GitHub Pages deployment
    page.goto('https://mrhanfx-code.github.io/mfm-corporation')
    
    # Wait for page to load
    page.wait_for_load_state('networkidle')
    
    # Capture console errors
    console_messages = []
    def handle_console(msg):
        if msg.type == 'error':
            console_messages.append({
                'type': msg.type,
                'text': msg.text,
                'location': msg.location
            })
    
    page.on('console', handle_console)
    
    # Take screenshot
    page.screenshot(path='E:/Documents/mfm-corporation/live-deployment-screenshot.png', full_page=True)
    
    # Wait a bit for any delayed errors
    page.wait_for_timeout(5000)
    
    # Check for JavaScript errors
    print("=== Console Errors ===")
    if console_messages:
        for msg in console_messages:
            print(f"Error: {msg['text']}")
            print(f"Location: {msg['location']}")
    else:
        print("No console errors detected")
    
    # Get page title
    print(f"\nPage title: {page.title()}")
    
    browser.close()
    
    print("\n=== Test Complete ===")
    print(f"Screenshot saved to: E:/Documents/mfm-corporation/live-deployment-screenshot.png")
