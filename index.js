const express = require('express')
const mcache = require('memory-cache')
const app = express()
const { spawn } = require("child_process");
const fs = require('fs')
var exec = require('child_process').exec;
function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};
function setIntervalImmediately(func, interval) {
  func();
  return setInterval(func, interval);
}
let v6cmd = "birdc s r table master6 | grep 'AS' | grep '::' | grep '/' | wc -l"
let v4cmd = "birdc s r table master4 | grep 'AS' | grep '/' | wc -l"
let v6asnscmd = `birdc s r table master6 | grep 'AS' | grep '/' | grep -oE "[^ ]+$" | sed "s/i//g" | sed "s/e//g" | sed 's/[^a-zA-Z0-9]//g'`
let v4asnscmd = `birdc s r table master4 | grep 'AS' | grep '/' | grep -oE "[^ ]+$" | sed "s/i//g" | sed "s/e//g" | sed 's/[^a-zA-Z0-9]//g'`
let asroutes = `birdc s r where bgp_path.last = {{ASN}} | rg -j 16 'AS' | rg -j 16 'unicast' | rg -j 16 '/' | cut -d ' ' -f1`
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
