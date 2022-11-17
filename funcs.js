const mcache = require('memory-cache')
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

module.exports = {execute:execute,setIntervalImmediately:setIntervalImmediately,v6cmd:v6cmd,v4cmd:v4cmd,v6asnscmd:v6asnscmd,v4asnscmd:v4asnscmd,asroutes:asroutes}
