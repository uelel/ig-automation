const fs = require('fs')
const process = require('process')
const puppeteer = require('puppeteer')
const date = require('date-and-time')
const { ArgumentParser } = require('argparse')
const Login = require('./login.js')


class Like extends Login {

  /**
   * Select random item from given array
   * @param {array}
   * @param {int} - if given, only first N items of array are processed
   * @return {object} item
   */
  async SelectRandomItem(array,N=null) {
    if (N) { var array = array.slice(0,N-1) }
    return array[Math.floor(Math.random() * array.length)]
  }
    
  /**
   * Check whether given page with Instagram account is empty or not
   * @param {page object}
   * @return {bool}
   */
  async CheckEmptyAccount(page) {
    const [ res ] = await page.$x("//*[contains(text(), 'No Posts Yet')]")
    if (res) return true
    else return false
  }

  /**
   * Combine given parent and child CSS selectors with given combinator
   * @param {str} par - parent selector
   * @param {str} comb - combinator between par and child
   * @param {str} child - child selector
   * @return {str} combined selector
   */
  async CSS(par,comb,child) {
    return par+" "+comb+" "+child
  }

  /**
   * Parse given string into Date object with defined format
   * Compare parsed Date object against lastImgDt attribute
   * @param {str} str
   * @return {bool} True in case dt > lastImgDt, false otherwise
   */
  async CompareDt(str) {
    const dt = await date.parse(str, 'YYYY-MM-DDTHH:mm:ss.SSS ')
    if (dt > this.lastImgDt) return true
    else return false
  }

  /**
   * Check whether profile with given page and imgArray is actual
   * Calls this.CompareDt to resolve
   * @param {page object} page - with profile
   * @param {array} imgArray - array with elements of profile images
   * @return {bool} True in case account is actual, false otherwise
   */
  async CheckActualProfile(page, imgArray) {
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
   * Check whether profile with given page contains like button that is checked
   * @param {page object} page - with profile
   * @return {bool} True in case like button exists and is checked, false otherwise
   */
  async CheckLikeStatus(page) {
    try {
      const fill = await page.$eval(this.sel.selImgDiv+this.sel.likeButton,
                                    el => el.getAttribute('fill'))
      if (fill === this.likeButtonFill) return true
      else return false
    } catch (err) {
      return false
    }
  }

  /**
   * Logic to apply likes
   */
  async ApplyLikes(page, imgArray) {
    process.stdout.write(' .. ')
    // Loop over likes
    for (let j=0; j<Math.min(this.likesPerProfile, imgArray.length); j++) {
      // Open image
      await imgArray[j].click()
      // Wait until like button appears
      try {
        await page.waitForSelector(this.sel.selImgDiv+this.sel.likeButton,
                                   { visible: true,
                                     timeout: 10000 })
        if (!(await this.CheckLikeStatus(page))) {
          // Click like button
          await page.click(this.sel.selImgDiv+this.sel.likeButton)
          process.stdout.write((j+1)+' ')
          // Sleep
          await this.Sleep(this.sleepMs)
        } else {
          process.stdout.write('already liked ')
        }
      } catch (err) {
        process.stdout.write('error occured ')
      }
      // Close image
      await page.click(this.sel.closeButton)
    }
    process.stdout.write('\n')
  }

  /**
   * Logic to select profiles
   */
  async SelectProfiles() {
    this.profileList = await this.LoadFileRows(this.fileName)
    // Loop over profiles
    for (let i=0; i<this.noProfiles; i++) {
      // Select profile
      var profileName = await this.SelectRandomItem(this.profileList)
      //var profileName = 'richard_official16'
      // Open new page
      process.stdout.write(profileName)
      var page = await this.OpenPage("https://www.instagram.com/"+profileName)
      // Check whether account is not empty
      if (!(await this.CheckEmptyAccount(page))) {
        await this.Sleep(1000)
        const imgArray =  await page.$$(this.sel.imagesDiv)
        // Check whether account is actual
        if (await this.CheckActualProfile(page,imgArray)) {
          // Apply likes
          await this.ApplyLikes(page,imgArray)
        // Select new profile in case account is not actual
        } else {
          process.stdout.write(' .. profile is not actual\n')
          i = i-1
        }
      // Select new profile in case account is empty
      } else {
        process.stdout.write(' .. profile is private\n')
        i = i-1
      }
      // Close page
      await page.close()
    }
  }

  async Init() {
    await super.Init()

    process.stdout.write('Liking photos of ' +
                         this.noProfiles +
                         ' profiles from given list \"' +
                         this.fileName + '\"\n')
    process.stdout.write('Each selected profile receives '+this.likesPerProfile+' likes\n\n')
    process.stdout.write('Selected profiles:\n')
    await this.SelectProfiles()

    await this.Close()
  }

  /**
   * Like photos of given Instagram profiles
   *
   * @param {str} login - file with login data to log into Instagram
   * @param {str} cookies - json file with cookies (optional)
   * @param {str} proxy - file with proxy settings (optional)
   * @param {str} fileName - file name with list of valid profiles
   * @param {number} noProfiles - how many profiles should be liked
   * @param {number} likesPerProfile - how many first photos to like per profile
   */
  constructor(login,
              cookies,
              proxy,
              fileName,
              noProfiles,
              likesPerProfile) {

    super(login, cookies, proxy)
    
    this.fileName = fileName
    this.noProfiles = noProfiles
    this.likesPerProfile = likesPerProfile


    // DOM selectors
    // Array with divs of images on profile page
    // Parent body
    this.sel.imagesDiv = 'body article:first-child > div:nth-of-type(1) > div > div > div'
    // Article element with maximized image
    // Parent body
    this.sel.selImgDiv = 'body div[role=dialog] > article'
    // Time element with datetime of maximized image
    // Parent selImgDiv
    this.sel.imgDateTime = ' > div:nth-of-type(3) > div:nth-of-type(2) time'
    // Like button on maximized image
    // Parent selImgDiv
    this.sel.likeButton = ' svg[aria-label=\"Like\"][width=\"24\"],svg[aria-label=\"Unlike\"][width=\"24\"]'
    // Close button on maximized image
    // Parent body
    this.sel.closeButton = 'body svg[aria-label=\"Close\"]'

    // Sleep time between likes
    this.sleepMs = 20000

    // Earliest datetime of last added post on a profile
    this.lastImgDt = new Date(2021,3,1)

    // Fill color of checked like button
    this.likeButtonFill = '#ed4956'
  }
}

module.exports = Like