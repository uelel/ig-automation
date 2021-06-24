# ig-automation

This is simple Instagram bot based on Node.js/Puppeteer.  
It was developed for my personal need of propagating a commercial Instagram profile.  

I don't believe that any Instagram bot is capable of:
* write meaningful comments under Instagram posts
* follow/unfollow users without them noticing it  

For that reason this bot has two main features:  

**1. Scrape list of followers of given Instagram profile**  
**2. Like posts of given Instagram users**  

___

## Prerequisities
- Node.js, npm cli
- Puppeteer ^9.0.0
- argparse ^2.0.1
- date-and-time ^1.0.0

___

## Usage
`npm install`  

User configuration is stored in `run.js`.

1. `node run list`
#### Parameters
| Parameter | Explanation | Example |
| ------------- |:-------------:| :----- |
| `login='./data/login'` | File containing two lines with Instagram login data: | <pre>instagram-username<br/>instagram-password</pre> |
| `cookies='./data/cookies.json'` | Instagram requires `sessionid` cookie to be present in all pages and requests. For that reason user must provide this additional token in json file as exported from Chrome | <pre>[<br>  {<br>    "name": "sessionid",<br>    "value": "token",<br>    "domain": ".instagram.com",<br>    "path": "/",<br>    "expires": -1,<br>    "httpOnly": true,<br>    "secure": true,<br>    "sameParty": false<br>  }<br>]</pre> |
| `proxy='./data/proxy'` | If given, bot will connect via proxy. File contains three lines | <pre>proxy-server<br>proxy-username<br>proxy-password</pre> |
| `profile='name'` | Target rofile name for scrapping |  |
| `startFrom=0` | In case number>0 is given, bot scrolls down to given follower and starts scraping afterwards |  |
| `fileName='./data/profiles'` | Filename to save scrapped profile names |  |
  

