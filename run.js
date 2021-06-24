const process = require('process')
const Like = require('./like.js')
const List = require('./list.js')

if (process.argv[2] === 'like') {
  const w = new Like(login='./data/vkusov-login',
                     cookies='./data/vkusov-cookies.json',
                     proxy=null,
                     fileName='./data/cokoladovnajanek',
                     noProfiles=20,
                     likesPerProfile=1)
  w.Init()

} else if (process.argv[2] === 'like') {
  // cokoladovnajanek 1570
  const w = new List(login='./data/login4',
                     cookies=null,
                     proxy='./data/proxy',
                     profile='cokoladovnajanek',
                     startFrom=1570,
                     fileName='./data/cokoladovnajanek')
  w.Init()

} else {
  process.stdout.write('Unknown parameter '+process.argv[2]+'\n')
}
