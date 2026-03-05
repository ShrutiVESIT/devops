package tests;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

import java.time.Duration;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

import io.github.bonigarcia.wdm.WebDriverManager;

import java.time.Duration;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

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
    public void testPageTitleExists() {
        driver.get(BASE_URL);

        String title = driver.getTitle();
        Assert.assertTrue(title.length() > 0, "Page title should exist");
    }

    @Test(priority = 2)
    public void testNeoBrandLinkExists() {
        driver.get(BASE_URL);

        WebElement brandLink = driver.findElement(By.cssSelector("a[href='/']"));
        Assert.assertTrue(brandLink.isDisplayed(), "Brand link should be visible");
    }

    @Test(priority = 3)
    public void testPackTextExists() {
        driver.get(BASE_URL);

        WebElement pack = driver.findElement(By.xpath("//span[contains(text(),'PACK')]"));
        Assert.assertTrue(pack.isDisplayed(), "PACK text should be visible");
    }

    @Test(priority = 4)
    public void testToolkitSubtitle() {
        driver.get(BASE_URL);

        WebElement subtitle = driver.findElement(By.cssSelector("p.italic"));
        Assert.assertEquals(subtitle.getText().trim(), "Toolkit");
    }

    @Test(priority = 5)
    public void testNavigationBarExists() {
        driver.get(BASE_URL);

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        WebElement nav = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("nav")));

        Assert.assertTrue(nav.isDisplayed());
    }

    @Test(priority = 6)
    public void testMainSectionExists() {
        driver.get(BASE_URL);

        WebElement main = driver.findElement(By.tagName("main"));
        Assert.assertTrue(main.isDisplayed(), "Main section should exist");
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
