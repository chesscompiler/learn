
from playwright.sync_api import Page, expect, sync_playwright
import os

def test_ad_verification(page: Page):
    cwd = os.getcwd()
    file_path = f"file://{cwd}/verification/verify_ads.html"

    # Mock the ad config fetch since we are using file:// protocol
    # We can't easily mock fetch with file:// in all browsers due to CORS/security
    # But we wrote ad_config.json to disk.
    # However, fetch('.../ad_config.json') might fail on file:// depending on browser security.
    # Let's try to intercept the network request if possible, or just rely on the file being there if browser allows.
    # Chromium usually blocks file:// fetch.

    # Better approach: Inject the ad logic or mock fetch in the page context.
    page.route("**/*.json", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{ "adSnippets": [ { "jsFactory": "function() { var div = document.createElement(\'div\'); div.innerText = \'TEST AD CONTENT\'; div.className = \'test-ad-content\'; return { elements: [div] }; }" } ] }'
    ))

    page.goto(file_path)

    # Wait for ads to be injected
    page.wait_for_timeout(1000)

    # 1. Check Blog List Ads
    # We expect an ad after 4th card
    # Grid children: Card 1-4, Ad 1, Card 5-8, Ad 2

    blog_list = page.locator("#blog-list")
    children = blog_list.locator("> *")
    count = children.count()
    print(f"Blog list children count: {count}")

    # Expect 8 cards + 2 ads = 10 items
    # Note: main.js implementation might append or insert.
    # logic: forEach card... if index+1 % 4 == 0... insertAfter.
    # 8 cards.
    # i=3 (4th card) -> insert ad. List becomes 5 items so far processed? No, forEach iterates original collection usually if array.
    # "Array.from(blogList.children)" creates a static array snapshot.
    # So:
    # Card 4 -> Insert Ad A after Card 4.
    # Card 8 -> Insert Ad B after Card 8.
    # Total 10 items.
    expect(children).to_have_count(10)

    # Check 5th item is ad
    ad_card = children.nth(4)
    expect(ad_card).to_have_class(r"blog-card ad-card active-ad")
    expect(ad_card).to_contain_text("TEST AD CONTENT")
    expect(ad_card).to_be_visible()

    # 2. Check Reading Page Ads
    markdown_body = page.locator(".markdown-body")
    side_ads = markdown_body.locator(".side-ad-container")
    expect(side_ads).to_have_count(2) # 2 headings

    first_ad = side_ads.first
    expect(first_ad).to_have_class(r"side-ad-container active-ad")
    expect(first_ad).to_contain_text("TEST AD CONTENT")

    # Check positioning (desktop)
    # It should have a top style set
    # We can't easily check exact pixel value but check it exists
    top_val = first_ad.get_attribute("style")
    print(f"First ad style: {top_val}")
    assert "top:" in top_val

    page.screenshot(path="verification/ad_verification.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1400, "height": 1000}) # Desktop width for side ads
        try:
            test_ad_verification(page)
            print("Verification passed!")
        except Exception as e:
            print(f"Verification failed: {e}")
            exit(1)
        finally:
            browser.close()
