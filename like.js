const fs = require('fs')
const process = require('process')
const puppeteer = require('puppeteer')
const { ArgumentParser } = require('argparse')
const Login = require('./login.js')


class LikePhotos extends Login {

    /**
     * Load profiles from file into array
     */
    async LoadProfiles() {
        try {
            const data = await fs.promises.readFile(this.fileName,
                                                    { encoding: 'utf-8',
                                                      flag: 'r' })
            this.profileList = await data.toString().split("\n")
        } catch (err) {
            throw new Error("Profiles could not be loaded from file "+this.fileName+"\n",
                            err)
        }
    }

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
     * Search page DOM
     * @param {page object}
     * @return {array} Array with div elements containing images
     */
    async LoadImages(page) {
        const [ div ] = await page.$$(this.sel.imagesDiv)
        return await div.$$("div > div")
    }

    /**
     * Logic to like photos
     */
    async Like() {
        await this.LoadProfiles()
        // Loop over profiles
        for (let i=0; i<this.noProfiles; i++) {
            // Select and open profile
            var profileName = await this.SelectRandomItem(this.profileList)
            process.stdout.write(profileName+'\n')
            var page = await this.OpenPage("https://www.instagram.com/"+profileName)
            // Check whether account is not empty
            if (!(await this.CheckEmptyAccount(page))) {
                var imgArray = await this.LoadImages(page)
                // Loop over likes
                for (let j=0; j<this.likesPerProfile; j++) {
                    // Select image to like
                    var img = await this.SelectRandomItem(imgArray, 3)
                    // Open image
                    await img.click()
                    // Wait until like button appears
                    try {
                        await page.waitForSelector(this.sel.likeButton,
                                                   { visible: true,
                                                     timeout: 10000 })
                    } catch (err) {
                        throw new Error("Like button was not found in page DOM!\n", err)
                    }
                    // Click like button
                    await page.click(this.sel.likeButton)
                    // Sleep
                    await this.Sleep(this.sleepMs)
                }
            // Select new profile in case account is empty
            } else {
                i = i-1
            }
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
        await this.Like()

        await this.Close()
    }

    /**
     * Like photos of given Instagram profiles
     *
     * @param {str} email - email to use for login into Instagram
     * @param {str} password - password to use for login into Instagram
     * @param {str} fileName - file name with list of valid profiles
     * @param {number} noProfiles - how many profiles should be liked
     * @param {number} likesPerProfile - how many photos to like per profile
     */
    constructor(email,
                password,
                fileName,
                noProfiles,
                likesPerProfile) {

        super(email, password)
        
        this.fileName = fileName
        this.noProfiles = noProfiles
        this.likesPerProfile = likesPerProfile


        // DOM selectors
        this.sel.imagesDiv = 'body article:first-child > div:nth-of-type(1) > div',
        this.sel.likeButton = 'svg[aria-label=\"Like\"][width=\"24\"]'

        // Sleep time between likes
        this.sleepMs = 30000
    }
}


const w = new LikePhotos(email='pedobip388@dghetian.com',
                         password='V@9yx83$Rkwo*p',
                         fileName='./data/mozaika',
                         noProfiles=15,
                         likesPerProfile=1)
w.Init()
