const sqlite3 = require('sqlite3')
const sqlite = require('sqlite')

const path = require('path')
const dbPath = path.resolve(__dirname, '../data/tr5nr.sqlite')

async function query (query) {
  return sqlite
    .open({
      filename: dbPath,
      driver: sqlite3.Database
    })
    .then(db => {
      // do your thing
      let response = db.all(query)
      db.close()
      return response
    })
    .then(data => {
      return data
    })
    .catch(e => {
      console.log(e)
    })
}

module.exports = {
  query
}
