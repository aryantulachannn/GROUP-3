# Week 2 Data Analysis
2
 
3
## 1. Data Inventory
4
 
5
| Data Asset | Description | Source | Format |
6
|------------|-------------|---------|---------|
7
| Website Pages | Home, About, Contact pages | GROUP-3 Website | HTML |
8
| Images | Photos and graphics used on the site | Project Files | JPG/PNG |
9
| CSS Files | Website styling and layout | styles.css | CSS |
10
| JavaScript Files | Website functionality | scripts.js | JS |
11
| Contact Form Data | User-submitted information | Website Visitors | Form Data |
12
 
13
### Summary
14
The GROUP-3 website uses website pages, images, CSS files, JavaScript files, and contact form data to provide information and functionality to users.


Week 2 Data Analysis
Data Inventory
Data Asset	Description	Source	Format
index.html	Main homepage	Project Team	HTML
about.html	About page	Project Team	HTML
contact.html	Contact page	Project Team	HTML
style.css	Website styling	Project Team	CSS
script.js	Website functionality	Project Team	JavaScript
product module.txt	Product catalogue information	Project Team	TXT





## 2. Data Flow Diagram
2
 
3
![Data Flow Diagram](data-flow-diagramption
4
This diagram shows how users interact with the Student Product Catalogue website, how the website loads HTML, CSS, JavaScript, and product data, and how information is displayed back to users.



## 3. Data Risk Analysis

The EduMart website collects and processes product and user interaction data. The following table identifies potential risks associated with this data.

| Data / Asset         | Risk                                                                | Likelihood | Impact | Risk Level | Mitigation                                         |
| -------------------- | ------------------------------------------------------------------- | ---------- | ------ | ---------- | -------------------------------------------------- |
| Product prices       | Prices could be changed incorrectly or without authorisation        | Medium     | High   | Medium     | Regularly check prices and restrict editing access |
| Product information  | Product names or descriptions could be modified                     | Medium     | Medium | Medium     | Use GitHub version control and review changes      |
| Search input         | Malicious or unexpected input could affect website functionality    | Medium     | Medium | Medium     | Validate and sanitise user input                   |
| Cart data            | Cart information could be lost or manipulated                       | Low        | Medium | Low        | Minimise stored data and validate cart information |
| JavaScript functions | JavaScript could contain vulnerabilities or be modified maliciously | Medium     | High   | High       | Review code and test JavaScript before deployment  |
| Website source code  | Unauthorised users could modify the website                         | Medium     | High   | High       | Use GitHub access controls and protected branches  |
| Product images       | Images could be replaced or removed                                 | Low        | Medium | Low        | Use trusted image sources and review changes       |
| Website availability | The website could become unavailable                                | Low        | High   | Medium     | Maintain backups and monitor website availability  |

### Risk Treatment

The main risks can be reduced by:

* Restricting GitHub repository access to authorised team members.
* Reviewing code before changes are published.
* Using GitHub version control to track and recover previous versions.
* Validating user input from search and filtering functions.
* Avoiding unnecessary collection of personal information.
* Regularly checking product information and prices.
* Maintaining backups of important website files.

### Overall Risk

The highest risks for the EduMart website are related to **unauthorised source-code changes and JavaScript vulnerabilities**. Access controls, code reviews, input validation and version control should be used to reduce these risks.
