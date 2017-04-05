var testMeteor = require('../help/testMeteor'),
  colors       = require('colors'),
  path         = require('path'),
  fs           = require('fs'),
  prompt       = require('prompt'),
  _            = require('lodash'),
  exec         = require('../help/exec');

module.exports = function() {
  if(!testMeteor()) return false;


  let jsonFile = process.env.PWD+'/package.json'
  if(!fs.existsSync(jsonFile)) {
    console.log("Файл package.json не найден".red);
    return false;
  }
  let json = JSON.parse(fs.readFileSync(jsonFile));
  let mc = json._mc;
  if(!mc) {
    console.log("не сделан mc init");
    return false;
  }

  let scripts = {}
  let mongo = `mongod --syslog; MONGO_URL=mongodb://localhost:27017/${mc.db};`
  scripts['start'] = mongo+` meteor run;`
  scripts['production'] = mongo+` meteor run --production;`

  if(mc.remote) {
    let ssh = `ssh root@${mc.remote.ip}`;
    let service = `service ${mc.remote.service}`;
    scripts['deploy'] = `mc deploy; ${ssh} ${service} start`;
    scripts['remote-log'] = `${ssh} tail /var/log/syslog -n 1000 -f | grep ${mc.remove.service}`;
    scripts['remote-start'] = `${ssh} ${service} start`;
    scripts['remote-restart'] = `${ssh} ${service} restart`;
    scripts['remote-stop'] = `${ssh} ${service} stop`;
  }

  json.scripts = scripts;
  fs.writeFileSync(jsonFile, JSON.stringify(json, null, 2));

}
