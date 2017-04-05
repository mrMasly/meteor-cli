#!/usr/bin/env node

var program = require('commander');

var build  = require('./cmd/build');
var deploy = require('./cmd/deploy');
var init   = require('./cmd/init');
var db     = require('./cmd/db');
var sync   = require('./cmd/sync');
var scripts = require('./cmd/scripts');
var isMeteor = require('./help/isMeteor');
var cs = require('./cmd/cs');
var fs = require('fs');

var version = fs.readFileSync(__dirname+'/package.json');
  version = JSON.parse(version);
  version = version.version;

program.version(version);


program
  .command('init [type]')
  .description('Установить mc (meteor console) для текущего метеор-приложения')
  .action(init);

program
  .command('build [dir] [os]')
  .description('Собрать приложение под нужную платформу')
  .action(build);

program
  .command('deploy')
  .description('Опубликовать приложение на удаленном сервере')
  .action(deploy);

program
  .command('db [type]')
  .description('Синхронизировать Базу Данных с сервером')
  .action(db);

program
  .command('sync')
  .description('Синхронизировать директории с сервером, указанные в package.json->_mc->sync')
  .action(sync);

program
  .command('scripts')
  .description('Создасть npm scripts для приложеия')
  .action(scripts);

program
  .command('client2server')
  .description('Client-Server копирует серверные файлы с клиента на сервер')
  .action(cs);

program.parse(process.argv);
