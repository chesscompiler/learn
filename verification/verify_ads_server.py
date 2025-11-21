
from playwright.sync_api import Page, expect, sync_playwright
import os
import http.server
import socketserver
import threading
import time

PORT = 8000

def start_server():
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def test_ad_verification(page: Page):
    # Route ad config to return mock data
    # Note: SimpleHTTPRequestHandler serves files from CWD.
    # We can just create the file assets/js/ad_config.json (which we did in bash)
    # So we don't necessarily need to route if we serve the file.
    # But let's route to be sure we control the content.

    page.route("**/ad_config.json", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{ "adSnippets": [ { "jsFactory": "function() { var div = document.createElement(\'div\'); div.innerText = \'TEST AD CONTENT\'; div.className = \'test-ad-content\'; return { elements: [div] }; }" } ] }'
    ))

    # Go to localhost
    page.goto(f"http://localhost:{PORT}/verification/verify_ads.html")

    # Wait for ads
    page.wait_for_timeout(2000)

    # Check logs
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

    # 1. Check Blog List Ads
    blog_list = page.locator("#blog-list")
    children = blog_list.locator("> *")
    count = children.count()
    print(f"Blog list children count: {count}")

    expect(children).to_have_count(10)

    ad_card = children.nth(4)
    expect(ad_card).to_have_class(r"blog-card ad-card active-ad")
    expect(ad_card).to_be_visible()

    # 2. Check Reading Page Ads
    markdown_body = page.locator(".markdown-body")
    side_ads = markdown_body.locator(".side-ad-container")
    expect(side_ads).to_have_count(2)

    first_ad = side_ads.first
    expect(first_ad).to_be_visible()

    page.screenshot(path="verification/ad_verification_server.png", full_page=True)

if __name__ == "__main__":
    # Start server in background
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()
    time.sleep(1) # Wait for server

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1400, "height": 1000})
        try:
            test_ad_verification(page)
            print("Verification passed!")
        except Exception as e:
            print(f"Verification failed: {e}")
            exit(1)
        finally:
            browser.close()
