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
     * @return {object} item
     */
    async SelectRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)]
    }

    /**
     * Select random profile from this.profileList
     * @return {string} profile name
     */
    async SelectRandomProfile() {
        return await this.SelectRandomItem(this.profileList)
    }

    /**
     * Select random element from given list of elements
     * Use only first N elements for the choice
     * @return {element handle}
     */
    async SelectRandomEl(array,N) {
        return await this.SelectRandomItem(array.slice(0,N-1))
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
     * @return {array} Array with div elements containing profile images
     */
    async LoadImages(page) {
        const [ div ] = await page.$$(this.sel.imagesDiv)
        return await div.$$("div > div")
    }

    async selectPhoto() {

    }

    async likePhoto() {

    }

    async Init() {
        await super.Init()

        process.stdout.write('Liking photos of '+this.noProfiles+' profiles from given list\n')
        process.stdout.write('Each selected profile receives '+this.noLikesPerProfile+' likes\n')
        await this.LoadProfiles()

        for (let i=0; i<1; i++) {
            var profileName = await this.SelectRandomProfile()
            var page = await this.OpenPage("https://www.instagram.com/"+profileName)
            // Check whether account is empty
            if (!(await this.CheckEmptyAccount(page))) {
                var imgArray = await this.LoadImages(page)
                console.log(imgArray.length)
                var img = await this.SelectRandomEl(imgArray, 3)
                console.log(img)
                // Open image
                await img.click()
            }
        }
        //await this.RewindFol()
        //await this.FolLoader()
    }

    /**
     * Like photos of given Instagram profiles
     *
     * @param {str} email - email to use for login into Instagram
     * @param {str} password - password to use for login into Instagram
     * @param {str} fileName - file name with list of valid profiles
     * @param {number} noProfiles - how many profiles should be liked
     * @param {number} noLikesPerProfile - how many photos to like per profile
     */
    constructor(email,
                password,
                fileName,
                noProfiles,
                noLikesPerProfile) {

        super(email, password)
        
        this.fileName = fileName
        this.noProfiles = noProfiles
        this.noLikesPerProfile = noLikesPerProfile


        // DOM selectors
        this.sel.imagesDiv = 'body article:first-child > div:nth-of-type(1) > div'
    }
}


const w = new LikePhotos(email='pedobip388@dghetian.com',
                         password='V@9yx83$Rkwo*p',
                         fileName='./followers1',
                         noProfiles=10,
                         noLikesPerProfile=1)
w.Init()
