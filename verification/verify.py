
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get absolute path to the reproduction file
        cwd = os.getcwd()
        file_path = f"file://{cwd}/verification/reproduction.html"

        page.goto(file_path)

        # Take a full page screenshot
        page.screenshot(path="verification/screenshot.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    run()
