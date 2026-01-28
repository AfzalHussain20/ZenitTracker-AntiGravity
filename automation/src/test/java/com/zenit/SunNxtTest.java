package com.zenit;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.PageLoadStrategy;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.SkipException;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.List;
import java.util.Set;

public class SunNxtTest {

    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeMethod
    public void setup() {
        ChromeOptions options = new ChromeOptions();
        Map<String, Object> prefs = new HashMap<>();
        prefs.put("profile.default_content_setting_values.notifications", 2);
        options.setExperimentalOption("prefs", prefs);

        // Changed to NORMAL for stability as requested
        options.setPageLoadStrategy(PageLoadStrategy.NORMAL);

        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver(options);
        driver.manage().window().maximize();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
        wait = new WebDriverWait(driver, Duration.ofSeconds(45));
    }

    @AfterMethod
    public void teardown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @DataProvider(name = "accountCount")
    public Object[][] createData1() {
        String countStr = System.getProperty("account.count", "1");
        int count = Integer.parseInt(countStr);
        Object[][] data = new Object[count][1];
        for (int i = 0; i < count; i++)
            data[i][0] = i + 1;
        return data;
    }

    @Test(dataProvider = "accountCount")
    public void testSunNxtSignup(int iteration) throws InterruptedException {
        System.out.println("========== Starting Test Iteration: " + iteration + " ==========");

        // --- STEP 1: NAVIGATION & LANGUAGE ---
        System.out.println("[STEP 1] Navigating to Site...");
        driver.get("https://preprodpwa.sunnxt.in/");

        // WAITER: Ensure page is fully loaded (readyState=complete)
        wait.until(webDriver -> ((org.openqa.selenium.JavascriptExecutor) webDriver)
                .executeScript("return document.readyState").equals("complete"));

        try {
            WebElement tamilLang = wait
                    .until(ExpectedConditions.elementToBeClickable(By.xpath("//div[text()='Tamil']")));
            tamilLang.click();
            WebElement doneBtn = wait
                    .until(ExpectedConditions.elementToBeClickable(By.xpath("//button[text()='Done']")));
            doneBtn.click();
            wait.until(ExpectedConditions.invisibilityOf(doneBtn));
            System.out.println("Language 'Tamil' selected and Done.");
        } catch (Exception e) {
            System.out.println("[INFO] Language selection skipped (not found or already set).");
        }

        Thread.sleep(1500);

        // --- STEP 2: LOGIN INITIATION ---
        System.out.println("[STEP 2] Initiating Login Flow...");
        WebElement profileGroup = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//div[contains(@class,'relative group inline-block')]")));

        Actions act = new Actions(driver);
        act.moveToElement(profileGroup).perform();

        WebElement loginBtn = null;
        try {
            loginBtn = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[text()='Log In']")));
        } catch (Exception e) {
            safeClick(profileGroup);
            loginBtn = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//span[text()='Log In']")));
        }
        safeClick(loginBtn);
        System.out.println("Clicked Log In.");

        // --- STEP 3: ACCOUNT REGISTRATION ---
        System.out.println("[STEP 3] Entering Account Details...");
        String randomEmail = generateRandomEmail();
        System.out.println("Generated Email: " + randomEmail);

        WebElement continueBtn = wait
                .until(ExpectedConditions.presenceOfElementLocated(By.xpath("//button[text()='Continue']")));
        WebElement emailField = wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("email")));
        emailField.clear();
        emailField.sendKeys(randomEmail);
        wait.until(ExpectedConditions.elementToBeClickable(continueBtn)).click();

        WebElement createAccountBtn = wait
                .until(ExpectedConditions.presenceOfElementLocated(By.xpath("//button[text()='Create Account']")));

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("newPassword"))).sendKeys("A1234567");
        driver.findElement(By.name("confirmPassword")).sendKeys("A1234567");
        wait.until(ExpectedConditions.elementToBeClickable(createAccountBtn)).click();
        System.out.println("Password set and Account created.");

        // --- STEP 4: DEMOGRAPHICS ---
        System.out.println("[STEP 4] Setting Demographics...");
        try {
            WebElement demoHeader = wait
                    .until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//h3[text()='Almost done!']")));
            if (demoHeader.isDisplayed()) {
                wait.until(ExpectedConditions
                        .elementToBeClickable(By.xpath("(//div[contains(@class,'newsignin_dropdown_input')])[1]")))
                        .click();
                wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//div[text()='Male']"))).click();

                wait.until(ExpectedConditions
                        .elementToBeClickable(By.xpath("(//div[contains(@class,'newsignin_dropdown_input')])[2]")))
                        .click();
                wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//div[text()='18 - 24 Years']"))).click();

                wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[text()='Save']"))).click();
                System.out.println("Demographics saved successfully.");
            }
        } catch (Exception e) {
            System.out.println("[INFO] Demographics skipped.");
        }

        // --- STEP 5: SUBSCRIPTION & PAYMENT ---
        System.out.println("[STEP 5] Starting Subscription Flow...");
        handleSubscription();

        System.out.println("========== Test Iteration " + iteration + " Completed Successfully ==========");
    }

    private void handleSubscription() throws InterruptedException {
        try {
            // 5.1 Navigate to Plans
            WebElement profileIcon = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("//div[contains(@class,'relative group inline-block')]")));
            safeClick(profileIcon);
            Thread.sleep(3000);

            // 5.2 Select Plan (Second item)
            WebElement secondPlan = wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("(//div[contains(@class,'flex flex-col items-center justify-end')])[2]")));
            secondPlan.click();
            System.out.println("Selected Subscription Plan.");

            wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[text()='Proceed']"))).click();

            // 5.3 Card Information
            wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("(//div[text()='Credit / Debit / ATM Card'])[1]"))).click();

            wait.until(ExpectedConditions.visibilityOfElementLocated(
                    By.xpath("(//input[@placeholder='Enter 16 digit Card Number'])[1]")))
                    .sendKeys("5555555555554444");

            driver.findElement(By.xpath("(//input[@placeholder='MM / YY'])[1]")).sendKeys("0526");
            driver.findElement(By.xpath("(//input[@placeholder='CVV'])[1]")).sendKeys("111");
            driver.findElement(By.xpath("(//input[@placeholder='Name on Card'])[1]")).sendKeys("Test User");
            System.out.println("Entered Dummy Card Details.");

            // 5.4 State Selection
            wait.until(ExpectedConditions.elementToBeClickable(By.xpath("(//span[text()='Choose State'])[1]"))).click();
            wait.until(ExpectedConditions.elementToBeClickable(
                    By.xpath("(//div[text()='Andaman and Nicobar Islands'])[1]"))).click();

            wait.until(ExpectedConditions.elementToBeClickable(By.xpath("(//button[text()='Continue'])[1]"))).click();
            System.out.println("Clicked Continue. Waiting for Payment Gateway...");

            // 5.5 Handling Hidden/New Window Payment
            String parentWindow = driver.getWindowHandle();
            Thread.sleep(5000); // Wait for potential window pop

            // --- STRATEGY 1: Check for New Windows (Razorpay Logic) ---
            Set<String> allWindows = driver.getWindowHandles();
            if (allWindows.size() > 1) {
                for (String win : allWindows) {
                    if (!win.equals(parentWindow)) {
                        driver.switchTo().window(win);
                        System.out.println("[PAYMENT] Switched to new popup window.");

                        // Razorpay Specific Logic as requested
                        try {
                            // 1. Click 'INR' or Currency Button
                            WebElement inrBtn = wait.until(ExpectedConditions.elementToBeClickable(
                                    By.xpath("//div[contains(text(),'INR') or contains(@class,'currency')]")));
                            inrBtn.click();
                            System.out.println("[razorpay] Selected INR/Currency.");

                            Thread.sleep(1000);

                            // 2. Click Success/Pass Button
                            // Try simulated success button often found in sandbox environments
                            WebElement successBtn = wait.until(ExpectedConditions.elementToBeClickable(
                                    By.xpath(
                                            "//button[contains(text(),'Success') or contains(text(),'Pass') or @id='success-btn']")));
                            successBtn.click();
                            System.out.println("[razorpay] Clicked Success/Pass button.");

                        } catch (Exception e) {
                            System.out.println(
                                    "[razorpay] Specific INR/Pass flow skipped or not found: " + e.getMessage());
                        }
                    }
                }
            } else {
                System.out.println("[PAYMENT] No new window detected. Staying on parent.");
            }

            // --- STRATEGY 2: Exhaustive Iframe & JS Search (User provided logic) ---
            boolean clickSuccess = false;
            JavascriptExecutor js = (JavascriptExecutor) driver;

            // Check main page first
            try {
                Object mainResult = js.executeScript(
                        "var btn = document.getElementById('submit-action'); if(btn){btn.click(); return true;} return false;");
                if (mainResult != null && (Boolean) mainResult) {
                    System.out.println("[PAYMENT] Success! Clicked 'submit-action' on MAIN content via JS.");
                    clickSuccess = true;
                }
            } catch (Exception e) {
            }

            if (!clickSuccess) {
                List<WebElement> frames = driver.findElements(By.tagName("iframe"));
                System.out.println("[PAYMENT] Searching " + frames.size() + " iframes...");

                for (int j = 0; j < frames.size(); j++) {
                    try {
                        driver.switchTo().defaultContent(); // Reset
                        if (allWindows.size() > 1) {
                            // If we are in a popup, stay there; complicated logic if mingled, but assuming
                            // focus covers it
                        }

                        driver.switchTo().frame(j);
                        String jsScript = "var btn = document.getElementById('submit-action');" +
                                "if(btn) { btn.click(); return true; } return false;";

                        Object result = js.executeScript(jsScript);
                        if (result != null && (Boolean) result) {
                            System.out
                                    .println("[PAYMENT] Success! Clicked 'submit-action' via JS in Iframe index: " + j);
                            clickSuccess = true;
                            break;
                        }
                    } catch (Exception e) {
                        // Continue to next iframe
                    }
                }
            }

            if (!clickSuccess) {
                System.out.println("[PAYMENT WARNING] Submit button not found in Main or Iframes.");
            } else {
                System.out.println("[PAYMENT] Payment Submit action triggered.");
            }

            // Return to parent
            if (driver.getWindowHandles().contains(parentWindow)) {
                driver.switchTo().window(parentWindow);
            }

        } catch (Exception e) {
            System.out.println("Error in Subscription Flow: " + e.getMessage());
        }
    }

    private void safeClick(WebElement element) {
        try {
            wait.until(ExpectedConditions.elementToBeClickable(element)).click();
        } catch (Exception e) {
            // JS Click fallback
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
        }
    }

    private String generateRandomEmail() {
        String rand = "zenit" + ((new Random().nextInt(9999)) + 1) + "@hotmail.com";
        return rand;
    }
}
