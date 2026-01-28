
# ⚡ Zenit Automation Setup Guide

To execute the automation suites directly from the Zenit interface, your local system must be configured with **Java** and **Maven**.

### 1. Install Java (JDK)
Automation requires Java to run Selenium.
- **Download**: [Oracle JDK 21](https://www.oracle.com/java/technologies/downloads/#jdk21-windows) or [OpenJDK](https://adoptium.net/).
- **Verify**: Open a terminal and run `java -version`.
- **Environment**: Ensure `JAVA_HOME` is set in your Environment Variables.

### 2. Install Maven
Maven manages the dependencies (Selenium, TestNG).
- **Download**: [Apache Maven](https://maven.apache.org/download.cgi).
- **Install**: Extract the zip to a folder (e.g., `C:\Program Files\Maven`).
- **Path**: Add the `bin` folder (e.g., `C:\Program Files\Maven\bin`) to your System `PATH`.
- **Verify**: Open a terminal and run `mvn -version`.

### 3. Install Chrome
- Ensure you have **Google Chrome** installed.
- The automation script uses `WebDriverManager`, so it will automatically download the matching ChromeDriver.

### 4. Browser Permissions (VPN)
For the International flow:
1. Connect your VPN manually before clicking "Run".
2. Ensure usage of an IP that allows access to `sunnxt.in` international roster.

---
**Troubleshooting**:
- If the log says `'mvn' is not recognized`, you need to restart your VS Code or Terminal after installing Maven.
- If the browser closes instantly, check the logs for version mismatch errors.
