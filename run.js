const Like = require('./like.js')
const List = require('./list.js')

const w = new Like(login='./data/login1',
                   cookies=null,
                   proxy='./data/proxy',
                   fileName='./data/klubnika.prg',
                   noProfiles=1,
                   likesPerProfile=1)

/*
// 2043
const w = new List(login='./data/login1',
                   cookies=null,
                   proxy='./data/proxy',
                   profile='klubnika.prg',
                   startFrom=2043,
                   fileName='./data/klubnika.prg')
*/

w.Init()