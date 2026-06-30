from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    print("Navigating to https://mfm-corp.cc.cd...")
    page.goto('https://mfm-corp.cc.cd')
    
    print("Waiting for page to load...")
    page.wait_for_load_state('networkidle', timeout=10000)
    
    print("Taking screenshot...")
    page.screenshot(path='D:/documents/mfm-corporation/dashboard_screenshot.png', full_page=True)
    
    print("Getting page content...")
    content = page.content()
    print(f"Page title: {page.title()}")
    
    print("Looking for interactive elements...")
    buttons = page.locator('button').all()
    print(f"Found {len(buttons)} buttons")
    
    inputs = page.locator('input').all()
    print(f"Found {len(inputs)} inputs")
    
    links = page.locator('a').all()
    print(f"Found {len(links)} links")
    
    print("Checking for console errors...")
    console_errors = []
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
    
    print("Test complete. Screenshot saved to dashboard_screenshot.png")
    
    browser.close()
    
    if console_errors:
        print(f"\nConsole errors found: {len(console_errors)}")
        for error in console_errors:
            print(f"  - {error}")
    else:
        print("\nNo console errors detected")
