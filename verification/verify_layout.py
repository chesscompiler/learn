
from playwright.sync_api import Page, expect, sync_playwright
import os

def test_layout_verification(page: Page):
    # Get absolute path to the verification file
    cwd = os.getcwd()
    file_path = f"file://{cwd}/verification/verify_layout.html"

    # 1. Load the page
    page.goto(file_path)

    # 2. Check Blog List Grid
    # Check if it's a grid
    blog_list = page.locator(".blog-list")
    expect(blog_list).to_have_css("display", "grid")
    # Skip checking exact grid-template-columns string as it computes to pixels

    # 3. Check Card Width/Spans
    # We expect cards to be roughly 1/3 of container width (minus gap)
    # Container max-width 1200px. Padding 2rem (32px) each side. 1136px content width.
    # 3 columns. Gap 2rem (32px). (1136 - 64) / 3 = ~357px width per card.

    card = page.locator(".blog-card").first
    box = card.bounding_box()
    print(f"Card width: {box['width']}")

    # Assert width is reasonable (e.g. > 300px) to confirm it's not "extremely low width"
    assert box['width'] > 300, f"Card width {box['width']} is too small!"

    # 4. Take Screenshot
    page.screenshot(path="verification/layout_verification.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Set viewport to desktop size
        page.set_viewport_size({"width": 1280, "height": 800})
        try:
            test_layout_verification(page)
            print("Verification passed!")
        except Exception as e:
            print(f"Verification failed: {e}")
            exit(1)
        finally:
            browser.close()
