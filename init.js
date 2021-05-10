const process = require('process')
const puppeteer = require('puppeteer')


class Init {

    // Open page in new tab
    // Return page object
    async OpenPage(url) {
        const page = await this.browser.newPage()
        await page.goto(url, { waitUntil: 'networkidle0' })
        return page
    }

    // Accept cookies on Instagram
    async AcceptCookies() {
        await this.page.evaluate(
            el => el.click(),
            (await this.page.$x(this.sel.acceptCookiesButton))[0]
        )
    }

    // Login to Instagram
    async Login() {
        await this.page.focus(this.sel.usernameField)
        await this.page.keyboard.type(this.email)
        await this.page.focus(this.sel.passwordField)
        await this.page.keyboard.type(this.pwd)
        await this.page.focus(this.sel.loginButton)
        await this.page.keyboard.type('\n')
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' })
    }

    async run() {
        // Start browser
        this.browser = await puppeteer.launch(this.chromeOptions)

        process.stdout.write('Login to Instagram as : '+this.email+'\n')
        this.page = await this.OpenPage('https://www.instagram.com/accounts/login/')
        await this.AcceptCookies()
        await this.Login()
    }

    constructor(email,
                password) {

        this.email = email
        this.pwd = password

        // DOM selectors
        this.sel = {
            acceptCookiesButton: '//button[text()="Accept All"]',
            usernameField: '#loginForm > div > div:nth-child(1) > div > label > input',
            passwordField: '#loginForm > div > div:nth-child(2) > div > label > input',
            loginButton: '#loginForm > div > div:nth-child(3) > button'
        }

        // options for puppeteer.launch method
        this.chromeOptions = {
            headless: false,
            defaultViewport: {
                width: 960,
                height: 900
            },
            slowMo: 0,
            args: []
        }

        this.run()
    }

}

module.exports = Init
