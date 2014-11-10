var MessageFormat = require('messageformat');
var callsite = require('callsite');
var wrench = require('wrench');
var yaml = require('js-yaml');
var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');

var iterateThroughObject = function(object, objectName, eachString) {
  for(var key in object) {
    if(object.hasOwnProperty(key)) {
      var value = object[key];

      var innerObjectName = objectName + '.' + key;

      if(typeof value === 'string') {
        eachString(value, innerObjectName)
      }
      else if(!!value && value.constructor === Object) {
        iterateThroughObject(value, innerObjectName, eachString);
      }
    }
  }
};

module.exports = function(inputDir, outputDir) {
  var callPath = path.dirname(callsite()[1].getFileName()) + path.sep;
  var properPath = path.normalize(callPath + inputDir);

  var messages = {};
  var mfCached = {};

  var allFilePaths = wrench.readdirSyncRecursive(properPath);

  for(var i = 0, len = allFilePaths.length; i < len; ++i) {
    var filePathRelative = allFilePaths[i];
    var filePathAbsolute = path.normalize(properPath + path.sep + filePathRelative);

    if(fs.lstatSync(filePathAbsolute).isFile() && path.extname(filePathRelative) === '.yaml') {
      var fileContent = fs.readFileSync(filePathAbsolute, 'utf8');
      var fileContentObject = yaml.safeLoad(fileContent);

      var fileName = path.basename(filePathRelative, '.yaml');
      var fileDirNames = filePathRelative.split(path.sep);
      var langCode = fileDirNames.shift();
      fileDirNames.pop();

      var beginning = fileDirNames.join('/') + (fileDirNames.length >= 1 ? '/' : '') + fileName;

      if(!messages.hasOwnProperty(langCode)) {
        messages[langCode] = {};
      }

      if(!mfCached.hasOwnProperty(langCode)) {
        mfCached[langCode] = new MessageFormat(langCode);
      }

      var mf = mfCached[langCode];

      iterateThroughObject(fileContentObject, '', function(value, objectName) {
        messages[langCode][beginning + objectName] = mf.precompile(mf.parse(value.replace(/^\s+|\s+$/g, '')));
      });
    }
  }

  mkdirp.sync(path.normalize(callPath + outputDir + path.sep));

  for(var lang in messages) {
    if(messages.hasOwnProperty(lang)) {
      var langMessages = messages[lang];

      var precompiled = 'var t = {';

      for(var key in langMessages) {
        if(langMessages.hasOwnProperty(key)) {
          var message = langMessages[key];

          precompiled += '\'' + key + '\':' + message + ',';
        }
      }

      if(precompiled.slice(-1) === ',') {
        precompiled = precompiled.slice(0, -1);
      }

      precompiled += '};';

      var compiledContents = [
        '(function (root, factory) {',
        '  if (typeof define === \'function\' && define.amd) {',
        '    define([], factory);',
        '  } else if (typeof exports === \'object\') {',
        '    module.exports = factory();',
        '  } else {',
        '    root.t = factory();',
        '  }',
        '}(this, function () {',
        '  var i18n = ' + mf.functions() + ';',
        '  ' + precompiled,
        '  return function(key, d) {',
        '    return typeof t[key] === \'undefined\' ? key : t[key](d);',
        '  };',
        '}));',
      ].join("\n");

      fs.writeFileSync(path.normalize(callPath + outputDir + path.sep) + lang + '.js', compiledContents);
    }
  }
};
