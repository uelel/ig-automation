const process = require('process')
const puppeteer = require('puppeteer')


class Login {

    /**
     * Open page in new tab
     * @return {page object}
     */
    async OpenPage(url) {
        const page = await this.browser.newPage()
        await page.goto(url, { waitUntil: 'networkidle0' })
        return page
    }
    
    /**
     * Sleep for given time of ms
     * @param {int} ms
     */
    async Sleep(ms) {
       return new Promise((res) => { 
           setTimeout(res, ms)
       })
    }

    /**
     * Accept cookies on Instagram
     */
    async AcceptCookies() {
        try {
            await this.page.evaluate(
                el => el.click(),
                (await this.page.$x(this.sel.acceptCookiesButton))[0]
            )
        } catch (err) {
            process.stdout.write('Accept-cookies button was not found\n')
        }
    }

    /**
     * Login to Instagram
     */
    async Login() {
        await this.page.focus(this.sel.usernameField)
        await this.page.keyboard.type(this.email)
        await this.page.focus(this.sel.passwordField)
        await this.page.keyboard.type(this.pwd)
        await this.page.focus(this.sel.loginButton)
        await this.page.keyboard.type('\n')
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' })
    }

    async Init() {
        // Start browser
        this.browser = await puppeteer.launch(this.chromeOptions)

        process.stdout.write('Login to Instagram as : '+this.email+'\n')
        
        this.page = await this.OpenPage('https://www.instagram.com/accounts/login/')
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) '+
                                     'AppleWebKit/537.36 (KHTML, like Gecko) '+
                                     'Chrome/74.0.3729.169 Safari/537.36')

        await this.page.screenshot({ path: 'login.png' })
        await this.AcceptCookies()
        await this.Login()
    }

    async Close() {
        await this.browser.close()
    }

    /**
     * Launch Puppeteer
     * Login to Instagram with given account
     *
     * @param {str} email - email to use for login into Instagram
     * @param {str} password - password to use for login into Instagram
     */
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
            devtools: false,
            slowMo: 0,
            defaultViewport: {
                width: 960,
                height: 900
            },
            args: []
        }
    }
}

module.exports = Login
