var testMeteor = require('../help/testMeteor'),
  colors = require('colors'),
  path = require('path'),
  fs = require('fs'),
  prompt = require('prompt'),
  _ = require('lodash'),
  exec = require('../help/exec'),
  scripts = require('./scripts');
var init = function(type) {

  if(type == null) {
    initLocal(function() {
      prompt.confirm('Добавить сервер?', function(err, a) {
        if(a) {
          initRemote();
        }
      });
    });
  } else if(type == 'local') {
    initLocal();
  } else if(type == 'remote') {
    initRemote();
  }
}

var initLocal = function(callback) {

  var json, jsonFile;

  if(!testMeteor()) return false;

  jsonFile = process.env.PWD+'/package.json'
  if(!fs.existsSync(jsonFile)) {
    console.log("Файл package.json не найден".red);
    return false;
  }
  json = JSON.parse(fs.readFileSync(jsonFile));

  if(json._mc) {
    console.log("_mc уже существует в package.json".red);
    return false;
  }

  var mc = {}

  // определяем название приложения по директории
  app = _.last(_.compact(process.env.PWD.split('/')));

  // получаем нужные поля
  prompt.start();
  prompt.get([{
    name: 'app',
    message: 'Название приложения',
    required: true,
    default: app,
    before: function(val) {
      return mc.app = val;
    }
  },{
    name: 'db',
    message: 'Имя Базы Данных',
    required: true,
    default: app,
    conform: function() {
      // TODO проверять на наличие БД
      return true;
    },
    before: function(val) {
      return mc.db = val;
    }
  }], function() {
    // json.scripts.start = "export MONGO_URL=mongodb://localhost:27017/"+mc.db+"; meteor; ";
    json._mc = mc;
    fs.writeFileSync(jsonFile, JSON.stringify(json, null, 2));

    scripts();

    callback();

  });

}

var initRemote = function() {

  var json, jsonFile, remote = {};

  if(!testMeteor()) return false;

  jsonFile = process.env.PWD+'/package.json'
  if(!fs.existsSync(jsonFile)) {
    console.log("Файл package.json не найден".red);
    return false;
  }
  json = JSON.parse(fs.readFileSync(jsonFile));

  if(json._mc.remote) {
    console.log("_mc.remote уже существует в package.json".red);
    return false;
  }

  app = json._mc.app;
  db = json._mc.db;


  // получаем IP сервера
  prompt.start();
  prompt.get([{
    name: 'site',
    message: 'Сайт (доменное имя)',
    required: true,
    before: function(val) {
      if(val.indexOf('http') == -1) {
        val = 'http://'+val;
      }
      return remote.domain = val;
    }
  },{
    name: 'server',
    message: 'IP сервера',
    required: true,
    pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    before: function(val) {
      return remote.ip = val;
    }
  }, {
    name: 'user',
    message: 'username',
    required: true,
    conform: function(val) {
      remote.user = val;
      // проверяем подключание к серверу
      cmd = "ssh "+remote.user+"@"+remote.ip+" 'echo 2>&1' && echo 'OK' || echo 'NOK' ";
      return (exec(cmd) === 'OK')
    }
  }, {
    name: 'db',
    default: db,
    message: 'База данных на сервере',
    required: true,
    conform: function(val) {
      return remote.db = val;
      // проверяем подключание к серверу
      // TODO проверить чтобы такая база существовала
    }
  }, {
    name: 'path',
    default: 'meteor/'+app,
    message: 'Папка на сервере',
    require: true,
    conform: function (val) {
      _path = '~', ok = false;
      val = _.compact(val.split('/'));
      val.forEach(function(one) {
        files = exec("ssh "+remote.user+"@"+remote.ip+" 'cd "+_path+"; ls'");
        files = files.split("\n");
        if(files.indexOf(one)+1) {
          ok = false;
        } else {
          exec("ssh "+remote.user+"@"+remote.ip+" 'cd "+_path+"; mkdir "+one+"'");
          ok = true;
        }
        _path = _path + '/' + one;
      });
      if(!ok) {
        // проверяем - может директория пуста
        var ls = exec("ssh "+remote.user+"@"+remote.ip+" 'cd "+_path+"; ls -a'");
        ls = _.without(ls.split("\n"), '.', '..');
        if(ls.length == 0) {
          ok = true;
        } else {
          console.log("Директория существует и не пуста".red);
        }
      }
      _path = _path.replace('~/', '');
      _path = _path.replace('~', '');
      remote.path = _path
      return ok;
    }
  }, {
    name: 'port',
    required: true,
    default: 3000,
    before: function(val) {
      return remote.port = val;
    },
    conform: function() {
      // TODO сделать проверку порта на сервере
      return true;
    }
  },{
    name: 'service',
    default: app,
    message: 'Название сервиса',
    required: true,
    conform: function() {
      // TODO проверять чтобы такой сервис не был занят
      return true;
    },
    before: function(val) {
      return remote.service = 'meteor-'+val;
    }
  }], function(err, res) {

    remotePath = path.normalize("/var/www/"+remote.user+"/data/"+remote.path+"/main.js");

    // создаем сервис
    var service = []
    service.push("[UNIT]");
    service.push("Description="+app+" meteor app");
    service.push("");
    service.push("[Service]");
    service.push("User="+remote.user);
    service.push('Environment="ROOT_URL='+remote.domain+'"');
    service.push('Environment="PORT='+remote.port+'"');
    service.push('Environment="MONGO_URL=mongodb://localhost:27017/'+remote.db+'"');
    service.push("ExecStart=/usr/bin/node "+remotePath);
    service.push("ExecStop=/bin/kill -9 `ps ax | grep "+remotePath+" | awk '{print $1}'`");
    service.push("Restart=always");
    service.push("");
    service.push("StandardOutput=syslog");
    service.push("StandardError=syslog");
    service.push("SyslogIdentifier="+remote.service);
    service.push("[Install]");
    service.push("WantedBy=multi-user.target");
    service = service.join("\n");

    // создаем файл сервиса локально
    var localFile = process.env.PWD+'/'+remote.service+'.service';
    fs.writeFileSync(localFile, service);

    // копируем сервис на сервер
    console.log("Создаем сервис...".yellow);
    rsync = "rsync -a "+localFile+" root@"+remote.ip+":/lib/systemd/system";
    // console.log(rsync);
    e = exec(rsync);
    if(e) {
      console.log("error:".red+' '+e);
      return false;
    } else {
      fs.unlinkSync(localFile);
    }

    // регистрируем и запускаем сервис на сервере
    exec("ssh root@"+remote.ip+" 'systemctl daemon-reload; systemctl enable "+remote.service+"; service "+remote.service+" start' ");

    // все готово!
    console.log("Все получилось!".green);
    json._mc.remote = remote;
    fs.writeFileSync(jsonFile, JSON.stringify(json, null, 2));

  });



}


module.exports = init;
