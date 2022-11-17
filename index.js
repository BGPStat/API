const express = require('express')
const mcache = require('memory-cache')
const app = express()
const fs = require('fs')
var exec = require('child_process').exec;
const {v6cmd,v4cmd,v6asnscmd,v4asnscmd,asroutes,setIntervalImmediately,execute} = require('./funcs.js')

app.listen(80)
let amt6 = 0;
let amt4 = 0;
let v6asns = []
let v4asns = []
let v6only = []
let v4only = []
let tasns = []

var cache = (duration) => {
  return (req,res,next) => {
    let key = "__express__"+ req.originalUrl || req.url;
    let cachedBody = mcache.get(key)
    if (cachedBody) {
      res.send(cachedBody)
      return;
    } else {
      res.sendResponse = res.send
      res.send = (body) => {
        mcache.put(key,body,duration * 1000)
        res.sendResponse(body)
      }
      next();
    }
  }
}

setIntervalImmediately(() => {
  execute(v6cmd,function(routes6) {
    amt6 = parseInt(routes6.replace("\n",""));
  })
  execute(v4cmd,function(routes4) {
    amt4 = parseInt(routes4.replace("\n",""));
  })
  execute(v6asnscmd,function(asnsa) {
    v6asns = Array.from(new Set(asnsa.split("\n")))
    v6only = v6asns.filter(elem => {
        return !v4asns.includes(elem);
    })
    v4only = v4asns.filter(elem => {
        return !v6asns.includes(elem);
    })
  })
  execute(v4asnscmd,function(asnsa) {
    v4asns = Array.from(new Set(asnsa.split("\n")))
    tasns = []
    for(let i = 0; i < v4asns.length; i++) {
      if (v6asns.includes(v4asns[i])) {
        tasns.push(v4asns[i])
      }
    }
    for(let i = 0; i < v6asns.length; i++) {
      if (v4asns.includes(v6asns[i])) {
        tasns.push(v6asns[i])
      }
    }
    tasns = Array.from(new Set(tasns))
    v6only = v6asns.filter(elem => {
        return !v4asns.includes(elem);
    })
    v4only = v4asns.filter(elem => {
        return !v6asns.includes(elem);
    })
  })
  v6only = v6asns.filter(elem => {
      return !v4asns.includes(elem);
  })
  v4only = v4asns.filter(elem => {
      return !v6asns.includes(elem);
  })
  execute(`birdc s r | grep 'AS' | grep 'unicast' | grep '/' | sed "s/i//g" | sed "s/e//g"`,function(outti) {
    fs.writeFileSync("./ar.txt", outti)
  })
},120000)

let rf = require('fs').readdirSync("./routers")
for(let i = 0; i < rf.length; i++) {
    let ab = require('./routers/'+rf[i])
    app.use(ab.route,ab.router)
}


function getShit() {
    return {amt6:amt6,amt4:amt4,v6asns:v6asns,v4asns:v4asns,v6only:v6only,all:tasns};   
}
module.exports.fetch = getShit;


app.get("/routes/info",cache(120), async (req, res) => {
  res.json({v6:amt6,v4:amt4,asns:{v6:v6asns.length,v4:v4asns.length,v6only:v6only.length,v4only:v4only.length,all:tasns.length}})
})
app.get("/routes/:asn",cache(500),async(req,res) => {
  let a = req.params.asn;
  let c = asroutes.replace("{{ASN}}",a);
  execute(c,function(asnsa) {
    res.send(asnsa)
  })
})
