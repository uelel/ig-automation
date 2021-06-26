# ig-automation

This is a simple Instagram bot based on Node.js/Puppeteer.  
It was developed for my personal need of propagating a commercial Instagram profile.  
This process was implemented in 06/2021. It is possible that this implementation will need to be adjusted in the future.

___

## Features

I don't believe that any Instagram bot is capable of:
* write meaningful comments under Instagram posts
* follow/unfollow users without them noticing it  

For that reason this bot has been designed for only two purposes:  

1. Scrape list of followers of given Instagram profile
2. Like posts of given Instagram users

___

## Prerequisities
- Node.js, npm cli
- Puppeteer ^9.0.0
- argparse ^2.0.1
- date-and-time ^1.0.0

___

## Usage
`npm install`  

Most user configuration is stored in `run.js`.  More specific configuration as well as element selectors are stored in class constructors.

### 1. Scrape name of followers of given Instagram profile

`node run list`  

Bot opens list of followers of given Instagram profile.  
Each follower is checked:
* whether the profile is not private
* whether the profile is not empty
* whether the profile posts are newer than given treshold  

Names of suitable profiles are saved into given file.  

**NOTE**: This process is highly repetitive which means Instagram will not like it :) Never use your commercial profile and IP for this action.

| Parameter | Description | Example |
| :-----: |:----------------------:| :----- |
| ![Mandatory parameter](https://img.shields.io/badge/-MANDATORY-orange)<br>`login='./data/login'` | File containing two lines with Instagram login data. | <pre>instagram-username<br/>instagram-password</pre> |
| ![Optional parameter](https://img.shields.io/badge/-OPTIONAL-green)<br>`cookies='./data/cookies.json'` | Instagram requires `sessionid` cookie to be present in all pages and requests. For that reason user must provide this additional token in json file as exported from Chrome | <pre>[<br>  {<br>    "name": "sessionid",<br>    "value": "token",<br>    "domain": ".instagram.com",<br>    "path": "/",<br>    "expires": -1,<br>    "httpOnly": true,<br>    "secure": true,<br>    "sameParty": false<br>  }<br>]</pre> |
| ![Optional parameter](https://img.shields.io/badge/-OPTIONAL-green)<br>`proxy='./data/proxy'` | If given, bot will connect via proxy. File contains three lines | <pre>proxy-server<br>proxy-username<br>proxy-password</pre> |
| ![Mandatory parameter](https://img.shields.io/badge/-MANDATORY-orange)<br>`profile='name'` | Target profile name for scraping |  |
| ![Mandatory parameter](https://img.shields.io/badge/-MANDATORY-orange)<br>`startFrom=0` | In case number>0 is given, bot scrolls down to given follower and starts scraping afterwards |  |
| ![Mandatory parameter](https://img.shields.io/badge/-MANDATORY-orange)<br>`fileName='./data/profiles'` | Filename to save scraped profile names |  |
  
 <br>
  
### 2. Like posts of given Instagram users

`node run like`

This process is designed to imitate user behaviour and it is suitable for commercial profiles.  
The bot will open random profiles from given file and like their posts (if possible).  
Time delay is set between repetitive actions.  

**NOTE**: Instagram has limitations for number of likes per hour and per day. Not respecting those limitations may result in profile ban.

| Parameter | Description | Example |
| :-----: |:----------------------:| :----- |
| ![Mandatory parameter](https://img.shields.io/badge/-MANDATORY-orange)<br>`login='./data/login'` | File containing two lines with Instagram login data. | <pre>instagram-username<br/>instagram-password</pre> |
| ![Optional parameter](https://img.shields.io/badge/-OPTIONAL-green)<br>`cookies='./data/cookies.json'` | Instagram requires `sessionid` cookie to be present in all pages and requests. For that reason user must provide this additional token in json file as exported from Chrome | <pre>[<br>  {<br>    "name": "sessionid",<br>    "value": "token",<br>    "domain": ".instagram.com",<br>    "path": "/",<br>    "expires": -1,<br>    "httpOnly": true,<br>    "secure": true,<br>    "sameParty": false<br>  }<br>]</pre> |
| ![Optional parameter](https://img.shields.io/badge/-OPTIONAL-green)<br>`proxy='./data/proxy'` | If given, bot will connect via proxy. File contains three lines | <pre>proxy-server<br>proxy-username<br>proxy-password</pre> |
| ![Mandatory parameter](https://img.shields.io/badge/-MANDATORY-orange)<br>`fileName='./data/profiles'` | File with rows containing profile names to like | <pre>profilename1<br>profilename2<br>profilename3<br>...</pre> |
| ![Mandatory parameter](https://img.shields.io/badge/-MANDATORY-orange)<br>`noProfiles=20` | Number of profiles to like |  |
| ![Mandatory parameter](https://img.shields.io/badge/-MANDATORY-orange)<br>`likesPerProfile=1` | Number of likes per profile |  |
