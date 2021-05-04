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
        await this.page.$eval(this.sel.followersButton,
                              el => el.click())
        try {
            await this.page.waitForSelector(this.sel.followersDiv+" ul",
                                            { visible: true,
                                              timeout: 10000 })
        } catch (err) {
            throw new Error("List with followers was not found in page DOM!\n", err)
        }
    }

    // Check whether given page with Instagram account is private
    // Return bool
    async checkPrivateAccount(page) {
        const [ res ] = await page.$x("//*[contains(text(), 'This Account is Private')]")
        if (res) return true
        else return false
    }

    // Get Instagram account from given li element handle
    // Open account in new tab
    // Check whether account is private or not
    //
    async processAccount(li) {
        const [ a ] = await li.$$(" a")
        if (a) {
            // Get profile name
            const profileName = await this.page.evaluate(el => el.getAttribute('href'), a)
            // Open profile in new tab
            const page = await this.browser.newPage()
            await page.goto("https://www.instagram.com"+profileName,
                            { waitUntil: 'networkidle0' })
            // 
            if (!(await this.checkPrivateAccount(page))) {
                console.log(profileName)                
            }
            await page.close()
        } else {
            throw new Error("Profile name could not be found in given handle!\n")
        }
        this.folIter += 1
    }

    // Search page DOM
    // Return array with li elements containing links to followers
    async loadFolLst() {
        const [ folBox ] = await this.page.$$(this.sel.followersDiv)
        return await folBox.$$(" ul li")
    }

    async folLoader() {
        this.folIter = 0
        var rows = await this.loadFolLst()
        while (rows.length < this.totalFol-1) {
            // Process new rows
            while (this.folIter < rows.length-1) {
                await this.processAccount(rows[this.folIter])
            }
            // Scroll down the list in case all rows are processed
            await this.page.evaluate(
                el => el.scrollIntoView(true),
                rows[this.folIter-1])
            rows = await this.loadFolLst()
        }
    }

    async run() {
        await this.openPage()
        await this.loadProfile()
        await this.folLoader()
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
            followersDiv: "div[role=dialog] > div > div:nth-of-type(2)",
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
