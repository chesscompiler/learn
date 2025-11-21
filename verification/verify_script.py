
from playwright.sync_api import Page, expect, sync_playwright
import os

def test_search_functionality(page: Page):
    # Get absolute path to the verification file
    cwd = os.getcwd()
    file_path = f"file://{cwd}/verification/verify_search.html"

    # 1. Load the page
    page.goto(file_path)

    # 2. Verify initial state
    # Blog list should be visible, search results hidden
    expect(page.locator("#blog-list")).to_be_visible()
    expect(page.locator("#search-results")).not_to_be_visible()

    # 3. Test Search
    search_input = page.locator("#search-input")
    search_input.fill("tactics")

    # Wait for search to process (debouncing or async fetch)
    page.wait_for_timeout(500)

    # Blog list should be hidden, search results visible
    expect(page.locator("#blog-list")).not_to_be_visible()
    expect(page.locator("#search-results")).to_be_visible()

    # Verify results content
    expect(page.locator("#search-results")).to_contain_text("Advanced Tactics")

    # Verify Tag Links in Search Results
    # The JS should generate links like /learn/tags/tactics/
    # "Advanced Tactics" has tags "tactics"
    tag_link = page.locator("#search-results a.tag-chip").first
    expect(tag_link).to_have_attribute("href", "/learn/tags/tactics/")

    # 4. Test Search with Query Param
    # Reload with query param
    page.goto(file_path + "?q=strategy")
    page.wait_for_timeout(500) # Wait for JS to parse param and fetch

    expect(page.locator("#blog-list")).not_to_be_visible()
    expect(page.locator("#search-results")).to_be_visible()
    expect(page.locator("#search-results")).to_contain_text("Chess Strategy 101")

    # Take screenshot
    page.screenshot(path="verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_search_functionality(page)
            print("Verification passed!")
        except Exception as e:
            print(f"Verification failed: {e}")
            exit(1)
        finally:
            browser.close()
