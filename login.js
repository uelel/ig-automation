const fs = require('fs')
const process = require('process')
const puppeteer = require('puppeteer')
const Helper = require('./helper.js')

class Login extends Helper {

  /**
   * Register given cookie objects into this.CookiesArray
   * When cookie with given name exists, value is updated
   * Otherwise new object is created
   * @param {array} arr - array with cookie objects
   */
  async UpdateCookies(arr) {
    outer: for (let i=0; i<arr.length; i++) {
      var item = arr[i]
      // Update value in case name exists
      for (let j=0; j<this.CookiesArray.length; j++) {
        if (this.CookiesArray[j]["name"] === item["name"]) {
          this.CookiesArray[j]["value"] = await item["value"]
          continue outer
        }
      }
      // Add new record in case name does not exist
      await this.CookiesArray.push(item)
    }
  }

  /**
   * Download cookies from given page
   * Save cookies into this.CookiesArray
   * @param {page object} page
   */
  async DownloadCookies(page) {
    // Load page cookies from Instagram
     const array = await page.cookies("https://www.instagram.com")
     await this.UpdateCookies(array)
  }

  /**
   * Synchronize cookies in HTTP request header with this.CookiesArray
   * Make one-to-one copy
   */
  async SynchReqCookies() {
    this.httpReqHeaders["cookie"] = "";
    if (this.CookiesArray && this.CookiesArray.length > 0) {
      for (let i=0; i<this.CookiesArray.length; i++) {
        const item = this.CookiesArray[i];
        this.httpReqHeaders["cookie"] += await item["name"]+"="+item["value"]+"; "
      }
      // Remove last semicolon
      this.httpReqHeaders["cookie"] = await this.httpReqHeaders["cookie"].slice(0,-2)
    }
  }

  /**
   * Open new tab
   * Update cookies in HTTP request headers
   * Set correct HTTP request headers
   * Authenticate proxy if needed
   * @return {page object}
   */
  async NewPage() {
    const page = await this.browser.newPage()
    await this.SynchReqCookies()
    //console.log(this.httpReqHeaders)
    //await this.Debug(page)
    // set HTTP headers that prevails for given page
    await page.setExtraHTTPHeaders(this.httpReqHeaders)
    if (this.proxy) {
      await page.authenticate({
        username: this.proxyUser,
        password: this.proxyPwd
      })
    }
    return page
  }

  /**
   * Open page in new tab
   * Insert cookies to created page from this.CookiesArray
   * @param {str} url
   * @return {page object}
   */
  async OpenPage(url) {
    // Setup new page
    const page = await this.NewPage()
    //console.log((await page.goto(url, { waitUntil: 'networkidle0' })).request().headers())
    // Load URL
    const res = await page.goto(url, { waitUntil: 'networkidle0' })
    // Add cookies to page from this.CookiesArray
    // Instagram.com must be opened in order to add new cookies
    if (this.CookiesArray.length > 0) {
      await page.setCookie(...this.CookiesArray)
    }
    return page
  }

  /**
   * Accept cookies on given Instagram page
   * @param {page object}
   */
  async AcceptCookies(page) {
    try {
      await page.waitForXPath(this.sel.acceptCookiesButton,
                              { visible: true,
                                timeout: 30000 })
      await page.evaluate(el => el.click(),
        (await page.$x(this.sel.acceptCookiesButton))[0])
      await page.waitForNavigation({ waitUntil: 'networkidle0' })
    } catch (err) {
      process.stdout.write('Accept-cookies button was not found\n')
    }
  }

  /**
   * Login to given Instagram page
   * @param {page object}
   */
  async Login(page) {
    try {
      await page.waitForSelector(
              this.sel.usernameField,
              { visible: true,
                timeout: 30000 })
    } catch (err) {
      throw new Error('Login field was not found\n')
    }
    await page.focus(this.sel.usernameField)
    await page.keyboard.type(this.user)
    await page.focus(this.sel.passwordField)
    await page.keyboard.type(this.pwd)
    await page.focus(this.sel.loginButton)
    await page.keyboard.type('\n')
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
  }

  /**
   * Check whether given page contains Instagram login screen
   * @param {page object}
   * @return {bool} true in case login screen is displayed, false otherwise
   */
  async IsLoginScreen(page) {
    try {
      await page.waitForSelector(
              this.sel.usernameField,
              { visible: true,
                timeout: 10000 })
      return true
    } catch (err) {
      return false
    }
  }

  async Init() {

    // Load proxy settings if given
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
    this.browser = await puppeteer.launch(this.chromeOptions);

    // Load login data
    [ this.user,
      this.pwd ] = await this.LoadFileRows(this.login)

    // Load cookies if given
    if (this.cookies) {
      process.stdout.write('Loading cookies from : '+this.cookies+'\n')
      this.CookiesArray = await this.LoadJson(this.cookies) 
    }

    // Open Instagram and check landing screen
    this.page = await this.OpenPage('https://www.instagram.com/')
    //await this.Sleep(100000000)

    // Login in case of login screen
    if (await this.IsLoginScreen(this.page)) {
      process.stdout.write('Login to Instagram as : '+this.user+'\n')
      await this.AcceptCookies(this.page)
      await this.Login(this.page)
      //await this.Sleep(100000000)

    // Do nothing in case user is logged in
    } else {
      process.stdout.write('User '+this.user+' is already logged in\n')
      //await this.Sleep(100000000)
    }

    // Download actual cookies for further requests
    await this.DownloadCookies(this.page)
}


  /**
   * Launch Puppeteer
   * Login to Instagram with given account
   *
   * @param {str} login - file with login data to log into Instagram
   * @param {str} cookies - json file with cookies (optional)
   * @param {str} proxy - file with proxy settings (optional)
   */
  constructor(login,
              cookies,
              proxy) {
    super()

    this.login = login
    this.cookies = cookies
    this.proxy = proxy

    // DOM selectors
    this.sel = {
      acceptCookiesButton: '//button[text()="Accept All"]',
      usernameField: '#loginForm > div > div:nth-child(1) > div > label > input',
      passwordField: '#loginForm > div > div:nth-child(2) > div > label > input',
      loginButton: '#loginForm > div > div:nth-child(3) > button'
    }

    // Options for puppeteer.launch method
    this.chromeOptions = {
      headless: false,
      devtools: true,
      slowMo: 0,
      defaultViewport: {
          width: 960,
          height: 900
      },
      args: [
        '--disable-features=UserAgentClientHint',
        '--disable-web-security'
      ]
    }
   
    // HTTP request headers
    this.httpReqHeaders = {
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) '+
                    'AppleWebKit/537.36 (KHTML, like Gecko) '+
                    'Chrome/89.0.4389.90 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,'+
                'application/xml;q=0.9,image/avif,'+
                'image/webp,image/apng,*/*;q=0.8,'+
                'application/signed-exchange;v=b3;q=0.9',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.9,en;q=0.8',
      'cache-control': 'no-cache',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'cookie': ''
    }

    // Array containing actual cookies for HTTP requests
    this.CookiesArray = []
  }
}    

module.exports = Login
