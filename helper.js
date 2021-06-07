const fs = require('fs')

class Helper {

  /**
   * Sleep for given time of ms
   * @param {int} ms
   */
  async Sleep(ms) {
    return new Promise((res) => { 
      setTimeout(res, ms)
    })
  }

  /**
   * Set debugging point in given page
   * @param {page object} page
   */
  async Debug(page) {
    await page.evaluate(() => { debugger })
  }

  /**
   * Return bool representation of given string
   * @param {str} str
   * @return {bool} true in case of "true", false otherwise
   */
  async GetBool(str) {
    if (str === "true") return true
    else return false
  }

  /**
   * Check whether given file exists
   * @param {str} fileName
   * @return {bool} true in case file exists, false otherwise
   */
  async FileExists(fileName) {
    fs.access(fileName, (err) => {
      //  if any error
      if (err) return false
      else true
    })
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
   * Load given json file
   * @param {str} fileName
   * @return {array}
   */
  async LoadJson(fileName) {
   try {
      const data = await fs.promises.readFile(fileName,
                                              { encoding: 'utf-8',
                                                flag: 'r' })
      return await JSON.parse(data)
    } catch (err) {
      throw new Error("Data could not be loaded from file "+fileName+"\n",
                      err)
    } 
  }

  /**
  * Append given string to file
  */
  async WriteToFile(str) {
    // remove slashes from string
    var str = str.replace(/\//g, "")
    try {
      await fs.appendFile(this.fileName,
                          str+"\n",
                          err => { if (err) throw err })
    } catch (err) {
      throw new Error("Value "+str+" could not be written into file!\n",
                      err)
    }
  }

  /**
  * Write given json data to given file
  * @param {array} data
  * @param {str} fileName
  * @param {str} flag - writing flag
  */
  async WriteJson(data,fileName,flag) {
   try {
      const json = await JSON.stringify(data, null, 2)
      await fs.promises.writeFile(fileName,
                                  json,
                                  { encoding: 'utf-8',
                                    flag: flag })
    } catch (err) {
      throw new Error("Data could not be written into file "+fileName+"\n",
                      err)
    } 
  }

  /**
  * Close browser instance
  */
  async Close() {
    await this.browser.close()
  }
}

module.exports = Helper
