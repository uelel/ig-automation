const fs = require('fs')
const process = require('process')
const puppeteer = require('puppeteer')
const { ArgumentParser } = require('argparse')
const Init = require('./init.js')


class FollowersList extends Init {

    // Parse given string number to float
    // Return float
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
                                              el => { return el.innerHTML })
                        .catch(err => { 
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

    // Check whether given page with Instagram account is private or not
    // Return bool
    async checkPrivateAccount(page) {
        const [ res ] = await page.$x("//*[contains(text(), 'This Account is Private')]")
        if (res) return true
        else return false
    }

    // Append given string to file
    async writeToFile(str) {
        // remove slashes from string
        var str = str.replace(/\//g, "")
        try {
            await fs.appendFile(this.fileName,
                                str+"\n",
                                err => { if (err) throw err })
        } catch (err) {
            throw new Error("Value "+str+" could not be written into file!\n", err)
        }
    }

    // Print progress to stdout
    printProgress() {
        process.stdout.clearLine()
        process.stdout.cursorTo(0) 
        process.stdout.write('Progress: '+this.folIter+' from '+this.totalFol)
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
            const page = this.OpenPage("https://www.instagram.com"+profileName)
            // Write name in case account is not private
            if (!(await this.checkPrivateAccount(page))) {
                await this.writeToFile(profileName)
            }
            await page.close()
        } else {
            throw new Error("Profile name could not be found in given handle!\n")
        }
        this.printProgress() 
        this.folIter += 1
    }

    // Search page DOM
    // Return array with li elements containing links to followers
    async loadFolLst() {
        const [ folBox ] = await this.page.$$(this.sel.followersDiv)
        return await folBox.$$(" ul li")
    }

    // Get list of followers
    async folLoader() {
        this.folIter = this.startFrom
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

    // Rewind list of followers to n-th fol. specified by this.startFrom
    async rewindFol() {
        process.stdout.write('Scrolling down to '+this.startFrom+'-th profile\n')
        var rows = await this.loadFolLst()
        while (rows.length < this.startFrom) {
            await this.page.evaluate(
                el => el.scrollIntoView(true),
                rows[rows.length-1])
            rows = await this.loadFolLst()
        }
    }

    async run() {
        process.stdout.write('Scraping followers from Instagram profile: '+this.profile+'\n')
        await this.loadProfile()
        await this.rewindFol()
        await this.folLoader()
    }

    constructor(email,
                password,
                profile,
                startFrom,
                fileName) {

        super(email, password)
        
        this.profile = profile
        this.startFrom = startFrom
        this.fileName = fileName


        // DOM selectors
        this.sel.push({
            followersButton: '#react-root > section > main > div > header > section > ul > li:nth-child(2) > a > span',
            followersDiv: "div[role=dialog] > div > div:nth-of-type(2)",
        })

        this.run()
    }
}


// 851
new Worker(email='pedobip388@dghetian.com',
           password='V@9yx83$Rkwo*p',
           profile='russian.shop.mozaika.prague',
           startFrom=851,
           fileName='followers')
