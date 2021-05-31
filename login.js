const fs = require('fs')
const process = require('process')
const puppeteer = require('puppeteer')


class Login {

    /**
     * Open page in new tab
     * @return {page object}
     */
    async OpenPage(url) {
        const page = await this.browser.newPage()
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) '+
                                'AppleWebKit/537.36 (KHTML, like Gecko) '+
                                'Chrome/74.0.3729.169 Safari/537.36')
        if (this.proxy) {
            await page.authenticate({
                username: this.proxyUser,
                password: this.proxyPwd
            })
        }
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

    async Close() {
        await this.browser.close()
    }

    async Debug(page, message) {
        await page.evaluate(() => { debugger })
        console.log(message)
    }
   
    /**
     * Load file with given filename into array with rows
     * @param {str} fileName
     * @return {array} array with loaded rows
     */
    async LoadFileRows(fileName) {
        try {
            const data = await fs.promises.readFile(fileName,
                                                    { encoding: 'utf-8',
                                                      flag: 'r' })
            return await data.toString().split("\n")
        } catch (err) {
            throw new Error("Data could not be loaded from file "+fileName+"\n",
                            err)
        }
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

        // Load login data
        [ this.email,
          this.pwd ] = await this.LoadFileRows(this.login)

        // Load proxy settings if needed
        if (this.proxy) {
            process.stdout.write('Using proxy server from : '+this.proxy+'\n')
            [ this.proxyServer,
              this.proxyUser,
              this.proxyPwd ] = await this.LoadFileRows(this.proxy)
            this.chromeOptions.args.push('--proxy-server='+this.proxyServer)
        } else {
            this.chromeOptions.args.push('--no-proxy-server')
        }
        
        // Start browser
        this.browser = await puppeteer.launch(this.chromeOptions)

        process.stdout.write('Login to Instagram as : '+this.email+'\n')
        this.page = await this.OpenPage('https://www.instagram.com/accounts/login/')
        
        //this.Debug(this.page,'')
        //await this.page.screenshot({ path: 'login.png' })
        await this.AcceptCookies()
        await this.Login()
    }


    /**
     * Launch Puppeteer
     * Login to Instagram with given account
     *
     * @param {str} login - file with login data to log into Instagram
     * @param {str} proxy - file with proxy settings (optional)
     */
    constructor(login,
                proxy) {

        this.login = login
        this.proxy = proxy

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
            args: [ ]
        }
    }
}    

module.exports = Login
