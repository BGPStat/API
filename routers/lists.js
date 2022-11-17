const express = require('express')
const {fetch} = require('../index.js')
const router = new express.Router()

router.get("/lists/asns",async(req,res) => {
  let all = fetch();
  let d = []
  for (let i = 0; i < all.v6asns.length;i++) {
    d.push(all.v6asns[i])
  }
  for (let i = 0; i < all.v4asns.length;i++) {
    d.push(all.v4asns[i])
  }
  let e = Array.from(new Set(d))
  res.send(e.join("\n"))
})

router.get("/lists/v4asns",async(req,res) => {
  let all = fetch();
  res.send(all.v4asns.join("\n"))
})
router.get("/lists/v6asns",async(req,res) => {
  let all = fetch();
  res.send(all.v6asns.join("\n"))
})

module.exports.router = router;
module.exports.route = "/lists"
