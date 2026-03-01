package tests;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.By;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

public class HomePageTest {

    private WebDriver driver;
    private static final String BASE_URL = "http://localhost:5173";

    @BeforeClass
    public void setUp() {
        // Automatically download and set up ChromeDriver
        WebDriverManager.chromedriver().setup();

        // Run Chrome in headless mode (no GUI needed on Jenkins)
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--window-size=1920,1080");

        driver = new ChromeDriver(options);
    }

    @Test(priority = 1)
    public void testPageTitle() {
        driver.get(BASE_URL);
        String title = driver.getTitle();
        System.out.println("Page title: " + title);
        Assert.assertEquals(title, "NeoPack Kit", "Page title should be 'NeoPack Kit'");
    }

    @Test(priority = 2)
    public void testPageLoads() {
        driver.get(BASE_URL);
        WebElement body = driver.findElement(By.tagName("body"));
        Assert.assertTrue(body.isDisplayed(), "Page body should be visible");
    }

    @Test(priority = 3)
    public void testRootDivExists() {
        driver.get(BASE_URL);
        WebElement root = driver.findElement(By.id("root"));
        Assert.assertTrue(root.isDisplayed(), "Root div should be present and visible");
    }

    @Test(priority = 4)
    public void testNeoPackBrandingVisible() {
        driver.get(BASE_URL);

        // Check that the page body contains "NEOPACK" or "NeoPack" branding
        WebElement body = driver.findElement(By.tagName("body"));
        String pageText = body.getText();
        System.out.println("Page text contains: " + pageText.substring(0, Math.min(200, pageText.length())));

        boolean hasBranding = pageText.contains("NEO") || pageText.contains("Neo") || pageText.contains("NEOPACK") || pageText.contains("NeoPack");
        Assert.assertTrue(hasBranding, "Page should contain NeoPack branding");
    }

    @Test(priority = 5)
    public void testToolkitSubtitleVisible() {
        driver.get(BASE_URL);
        // The homepage has a <p> with "Toolkit" text
        WebElement subtitle = driver.findElement(By.cssSelector("p.italic"));
        Assert.assertTrue(subtitle.isDisplayed(), "Toolkit subtitle should be visible");
        Assert.assertEquals(subtitle.getText().trim(), "Toolkit", "Subtitle text should be 'Toolkit'");
    }

    @Test(priority = 6)
    public void testNavigationExists() {
        driver.get(BASE_URL);
        // The app has a TopBar navigation component
        WebElement nav = driver.findElement(By.tagName("nav"));
        Assert.assertTrue(nav.isDisplayed(), "Navigation bar should be present");
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
