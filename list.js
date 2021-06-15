const fs = require('fs')
const process = require('process')
const date = require('date-and-time')
const puppeteer = require('puppeteer')
const { ArgumentParser } = require('argparse')
const Login = require('./login.js')


class List extends Login {

  /**
   * Parse given string number to float
   * @return {float}
   */
  async ParseNumber(str) {
    try {
      return parseFloat(str.replace(/,/g, ''))
    } catch (err) {
      throw new Error("Number "+str+" could not be parsed!\n", err)
    }
  }

  /**
   * Check whether given page with Instagram account contains any posts
   * @param {page object}
   * @return {bool} True in case of no posts, false otherwise
   */
  async CheckEmptyAccount(page) {
    const [ res ] = await page.$x(this.sel.emptyProfile)
    if (res) return true
    else return false
  }

  /**
   * Parse given string into Date object with defined format
   * Compare parsed Date object against lastImgDt attribute
   * @param {str} str
   * @return {bool} True in case dt > lastImgDt, false otherwise
   */
  async CompareDt(str) {
    const dt = await date.parse(str, 'YYYY-MM-DDTHH:mm:ss.SSS ')
    if (dt > this.lastPostDt) return true
    else return false
  }
    
  /**
   * Check whether profile with given page is actual
   * Calls this.CompareDt to resolve
   * @param {page object} page - with profile
   * @return {bool} True in case account is actual, false otherwise
   */
  async CheckActualAccount(page) {
    const imgArray =  await page.$$(this.sel.imagesDiv)
    if (imgArray.length > 0) {
      // Open last added image
      await imgArray[0].click()
      // Wait for time element to appear
      await page.waitForSelector(this.sel.selImgDiv+this.sel.imgDateTime,
                                 { visible: true,
                                   timeout: 10000 })
      // Get datetime attribute
      try {
        const dt = await page.$eval(this.sel.selImgDiv+this.sel.imgDateTime,
                                    el => el.getAttribute('datetime'))
        //await this.Sleep(3000)
        if (await this.CompareDt(dt)) {
          await page.click(this.sel.closeButton)
          return true
        } else {
          await page.click(this.sel.closeButton)
          return false
        }
      } catch (err) {
        console.log('could not determite actual profile')
        console.log(err)
        await page.click(this.sel.closeButton)
        return false
      }
    } else {
      return false
    }
  }

  /**
   * Print progress to stdout
   */
  PrintProgress() {
    process.stdout.clearLine()
    process.stdout.cursorTo(0) 
    process.stdout.write('Progress: '+this.folIter+' from '+this.totalFol)
  }

  /**
   * Get Instagram account from given li element handle
   * Open account in new tab
   * Check whether account is private or not
   * @param{element handle} li - li element of given row
   */
  async ProcessAccount(li) {
    const a = await li.$(" a")
    if (a) {
      // Get profile name
      const profileName = await this.page.evaluate(el => el.getAttribute('href'), a)
      // Open profile in new tab
      const page = await this.OpenPage("https://www.instagram.com"+profileName)
      // Check whether account is not empty
      if (!(await this.CheckEmptyAccount(page))) {
        if (await this.CheckActualAccount(page)) {
          await this.WriteToFile(profileName)
        }
      //} else { 
          // await this.Debug(page,'empty profile')
      }
      await page.close()
    } else {
      //throw new Error("Profile name could not be found in given handle!\n")
      console.log('Profile name could not be found in given handle!')
    }
    this.PrintProgress() 
    this.folIter += 1
  }

  /**
   * Search page DOM
   * @return {array} Array with li elements containing links to followers
   */
  async LoadFolLst() {
    const folBox = await this.page.$(this.sel.followersDiv)
    return await folBox.$$(" ul li")
  }

  /**
   * Logic to get list of followers
   */
  async FolLoader() {
    this.folIter = this.startFrom
    var rows = await this.LoadFolLst()
    while (rows.length < this.totalFol-1) {
      // Process new rows
      while (this.folIter < rows.length-1) {
        await this.ProcessAccount(rows[this.folIter])
      }
      // Scroll down the list in case all rows are processed
      await this.page.evaluate(
        el => el.scrollIntoView(true),
        rows[this.folIter-1])
      rows = await this.LoadFolLst()
    }
  }

  /**
   * Rewind list of followers to n-th fol. specified by this.startFrom parameter
   */
  async RewindFol() {
    process.stdout.write('Scrolling down to '+this.startFrom+'-th profile\n')
    var rows = await this.LoadFolLst()
    while (rows.length < this.startFrom) {
      await this.page.evaluate(
        el => el.scrollIntoView(true),
        rows[rows.length-1])
      rows = await this.LoadFolLst()
    }
  }

  /**
   * Open profile page
   * Get number of followers
   * Open dialog with followers
   */
  async LoadProfile() {

    // Load profile page
    await this.page.goto('https://www.instagram.com/'+this.profile,
                         { waitUntil: 'networkidle0' })

    // Get number of followers
    this.totalFol = await this.page.$eval(this.sel.followersButton,
                                          el => { return el.innerHTML })
                    .catch(err => { 
                        throw new Error("Followers button was not found:\n", err)
                    })
    this.totalFol = await this.ParseNumber(this.totalFol)
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
    
  async Init() {
    await super.Init()

    process.stdout.write('Scraping followers from Instagram profile: '+this.profile+'\n')
    await this.LoadProfile()
    await this.RewindFol()
    await this.FolLoader()

    await this.Close()
  }
    
  /**
   * Download list with profile names of followers of given Instagram profile
   * Download only profiles that have open account (not private)
   * Download only profiles that have actual posts
   *
   * @param {str} login - file with login data to log into Instagram
   * @param {str} cookies - json file with cookies (optional)
   * @param {str} proxy - file with proxy settings (optional)
   * @param {str} profile - profile name to download followers from
   * @param {number} startFrom - first follower to download
   * @param {str} fileName - file name to save resulting list
   */
  constructor(login,
              cookies,
              proxy,
              profile,
              startFrom,
              fileName) {

    super(login, cookies, proxy)
    
    this.profile = profile
    this.startFrom = startFrom
    this.fileName = fileName


    // DOM selectors
    // Followers button on profile page
    // Parent body
    this.sel.followersButton = '#react-root > section > main > div > header > section > ul > li:nth-child(2) > a > span'
    // Div with opened list of followers
    // Parent body
    this.sel.followersDiv = "div[role=dialog] > div > div:nth-of-type(2)"
    // Xpath to evaluate whether Instagram profile contains some posts
    // Must be Xpath
    // Parent body
    this.sel.emptyProfile = "//*[contains(text(), 'This Account is Private') or " +
                             "   contains(text(), 'No Posts Yet')]"
    // Array with divs of images on profile page
    // Parent body
    this.sel.imagesDiv = 'body article:first-child > div:nth-of-type(1) > div > div > div'
    // Article element with maximized image
    // Parent body
    this.sel.selImgDiv = 'body div[role=dialog] > article'
    // Time element with datetime of maximized image
    // Parent selImgDiv
    this.sel.imgDateTime = ' > div:nth-of-type(3) > div:nth-of-type(2) time'
    // Close button on maximized image
    // Parent body
    this.sel.closeButton = 'body svg[aria-label=\"Close\"]'


    // Earliest datetime of last added post on a profile
    this.lastPostDt = new Date(2021,3,1)
  }
}

module.exports = List