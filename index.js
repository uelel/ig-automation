const fs = require('fs')
const process = require('process')
const puppeteer = require('puppeteer')
const { ArgumentParser } = require('argparse')


class Worker {

    // Open browser
    // Go to given url
    // Login to Instagram
    async openPage() {

        // Start browser
        this.browser = await puppeteer.launch(this.chromeOptions)
        this.page = await this.browser.newPage()
        await this.page.goto(this.url, { waitUntil: 'networkidle0' })

        // Accept cookies
        //var el = await this.page.$x(this.sel.acceptCookiesButton)
        //await el[0].click()
        await this.page.evaluate(
            el => el.click(),
            (await this.page.$x(this.sel.acceptCookiesButton))[0]
        )

        // Login to Instagram
        await this.page.focus(this.sel.usernameField)
        await this.page.keyboard.type(this.email)
        await this.page.focus(this.sel.passwordField)
        await this.page.keyboard.type(this.pwd)
        await this.page.focus(this.sel.loginButton)
        await this.page.keyboard.type('\n')
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' })
    }

    // Parse given string number to float
    async parseNumber(str) {
        try {
            return parseFloat(str.replace(/,/g, ''))
        } catch (err) {
            throw new Error("Number of followers could not be parsed!\n", err)
        }
    }

    // Open profile page
    // Get number of followers
    // Open dialog with followers
    async loadProfile() {

        // Load profile page
        await this.page.goto('https://www.instagram.com/'+this.profile,
                             { waitUntil: 'networkidle0' })

        // Get number of followers
        this.totalFol = await this.page.$eval(this.sel.followersButton,
                                              (el) => { return el.innerHTML })
                        .catch((err) => { 
                            throw new Error("Followers button was not found:\n", err)

                        })
        this.totalFol = await this.parseNumber(this.totalFol)
        //console.log(this.totalFol)

        // Open dialog with followers
        // Return followers box element
        await this.page.$eval(this.sel.followersButton,
                              el => el.click())
        try {
            await this.page.waitForXPath(this.sel.followersDiv+"//ul",
                                         { visible: true,
                                           timeout: 10000 })
        } catch (err) {
            throw new Error("List with followers was not found in page DOM!\n", err)
        }
        return (await this.page.$x(this.sel.followersDiv))[0]
    }

    // Check whether given page with Instagram account is private
    // Return bool
    async checkPrivateAccount(page) {
        const [ res ] = await page.$x("//*[contains(text(), 'This Account is Private')]")
        if (res) return true
        else return false
    }

    async checkAccount(li) {
        const [ a ] = await li.$x(".//a")
        if (a) {
            const profileName = await this.page.evaluate(el => el.getAttribute('href'), a)
            //const link = await this.page.evaluate(el => el.innerHTML, a)
            //console.log(profileName)
            const page = await this.browser.newPage()
            await page.goto("https://www.instagram.com"+profileName,
                            { waitUntil: 'networkidle0' })
            if (!(await this.checkPrivateAccount(page))) {
                console.log(profileName)                
            }
            await page.close()
        } else {
            throw new Error("Profile name could not be found in given handle!\n")
        }
    }

    async run() {
        await this.openPage()
        const folBox = await this.loadProfile()
        var [ folLst ] = await folBox.$x(".//ul")
        //console.log(await this.page.evaluate(el => el.innerHTML, folLst))
        var rows = await folLst.$x(".//li")
        //console.log(rows.length)
        //console.log(await this.page.evaluate(el => el.innerHTML, rows[0]))
        await this.checkAccount(rows[0])
        // check there are unread rows in list of followers
        // if there are some -> read them
        // if there are none -> load more rows
        // stop if no rows = this.totalFol
        //
        //await this.browser.close()
    }

    constructor(url,
                email,
                password,
                profile) {

        this.url = url
        this.email = email
        this.pwd = password
        this.profile = profile

        // DOM selectors
        this.sel = {
            acceptCookiesButton: '//button[text()="Accept All"]',
            usernameField: '#loginForm > div > div:nth-child(1) > div > label > input',
            passwordField: '#loginForm > div > div:nth-child(2) > div > label > input',
            loginButton: '#loginForm > div > div:nth-child(3) > button',
            followersButton: '#react-root > section > main > div > header > section > ul > li:nth-child(2) > a > span',
            followersDiv: "//div[@role='dialog']/div/div[2]",
            followersList: "//div[@role='dialog']//ul"
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


new Worker(url='https://www.instagram.com/accounts/login',
           email='ntrand@seznam.cz',
           password='cqiS6JW!ND#CyB',
           profile='russian.shop.mozaika.prague')
