const fs = require('fs')
const process = require('process')
const puppeteer = require('puppeteer')
const { ArgumentParser } = require('argparse')
const Login = require('./login.js')


class LikePhotos extends Login {

    async loadProfiles() {

    }

    async selectRandomProfile() {

    }

    async getPhotos(page) {

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
        await this.RewindFol()
        await this.FolLoader()
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
        this.sel.followersButton = '#react-root > section > main > div > header > section > ul > li:nth-child(2) > a > span'
        this.sel.followersDiv = "div[role=dialog] > div > div:nth-of-type(2)"
    }
}


const w = new LikePhotos(email='pedobip388@dghetian.com',
                         password='V@9yx83$Rkwo*p',
                         fileName='./followers1',
                         noProfiles=10,
                         noLikesPerProfile=1)
w.Init()
