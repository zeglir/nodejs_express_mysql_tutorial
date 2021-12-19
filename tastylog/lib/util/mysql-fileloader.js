/*
  https://github.com/garafu/mysql-fileloader
  https://www.npmjs.com/package/@garafu/mysql-fileloader
 */
const EXT = ".sql";
const fs = require("fs");
const path = require("path");

var config = {
  root: path.join(process.cwd(), "./sql")
};

/**
 * 
 */
var _cache = {};

/**
 * Create option object.
 * @returns {object}  Optioin object.
 */
var setOptions = function (options = {}) {
  options.getValueOrDefault = function (key, value) {
    return key in this ? this[key] : value;
  };
  return {
    recurse: options.getValueOrDefault("recurse", true)
  };
};

/**
 * Whethere the file is sql or not.
 * @param {string} filename file name.
 * @returns {boolean} Is sql file or not.
 */
var isTargetFile = function (filename) {
  return /.+\.sql$/i.test(filename || "");
};

/**
 * Trim comments and empty spaces and return codes.
 * @param {string} text SQL string.
 * @returns {string}  trimed sql string.
 */
var format = function (text = "") {
  // Remove comment line.
  text = text.replace(/-- .*/g, "");
  text = text.replace(/\/\*[\s\S]*?\*\//mg, "");
  // Remove spaces.
  text = text.replace(/\s+/g, " ").trim();
  return text;
};

var tryStat = function (path) {
  try {
    return fs.statSync(path);
  } catch (err) {
    return undefined;
  }
};

var getFilePath = function (root, name) {
  var loc, dir, file, filepath, stat;

  // Normalize path name.
  loc = path.resolve(root, name);
  dir = path.dirname(loc);
  file = path.basename(loc);

  // <dir>/<file>
  filepath = path.join(dir, file);
  stat = tryStat(filepath);
  if (stat && stat.isFile()) {
    return filepath;
  }

  // <dir>/<file><ext>
  filepath = path.join(dir, file + EXT);
  stat = tryStat(filepath);
  if (stat && stat.isFile()) {
    return filepath;
  }
};

/**
 * Load all sql files from specified folder.
 * @param {string} root Start directory.
 * @param {object} options Loading options.
 * @returns {object} Loaded sql strings.
 */
var loadSync = function (root, options) {
  var filelist = {};

  options = setOptions(options);

  var items = fs.readdirSync(root, { withFileTypes: true });

  for (var item of items) {
    var fullpath = path.join(root, item.name);
    if (options.recurse && item.isDirectory()) {
      var obj = loadSync(fullpath, options) || {};
      filelist = Object.assign(filelist, obj);
    } else if (isTargetFile(item.name)) {
      var name = path.basename(item.name, path.extname(item.name));
      var data = fs.readFileSync(fullpath, "utf-8");
      filelist[name] = format(data);
    }
  }

  return filelist;
};

/**
 * Load all sql files from specified folder.
 * @param {string} root Start directory.
 * @param {object} options Loading options.
 * @returns {Promise} Called when loaded sql files.
 */
var loadAsync = async function (root, options) {
  options = setOptions(options);

  return new Promise((resolve, reject) => {
    fs.readdir(root, { withFileTypes: true }, (error, items) => {
      if (error) {
        reject(error);
        return;
      }

      var promises = [];

      for (var item of items) {
        var fullpath = path.join(root, item.name);
        if (options.recurse && item.isDirectory()) {
          promises[promises.length] = loadAsync(fullpath, options);
        } else if (isTargetFile(item.name)) {
          promises[promises.length] = new Promise((resolve, reject) => {
            var name = path.basename(item.name, path.extname(item.name));
            fs.readFile(fullpath, "utf-8", (error, data) => {
              if (error) {
                reject(error);
                return;
              }
              resolve({ name, data });
            });
          });
        }
      }

      Promise.all(promises).then((results) => {
        var filelist = {};
        for (var item of results) {
          filelist[item.name] = format(item.data);
        }
        resolve(filelist);
      }).catch((error) => {
        reject(error);
      });
    });

  });
};

/**
 * @typedef {object}  SqlFileLoaderOptions
 * @property  {string}  root  Root directory path of loading SQL files.
 */
/**
 * Initialize SqlFileLoader.
 * @param {SqlFileLoaderOptions} [options]  SQL load options.
 * @returns {SqlFileLoader}
 */
var SqlFileLoader = function (options = {}) {
  SqlFileLoader.init(options);
  return SqlFileLoader;
};

/**
 * Initialize SqlFileLoader.
 * @param {SqlFileLoaderOptions} options 
 */
SqlFileLoader.init = function (options = {}) {
  config.root = options.root ? path.resolve(options.root) : config.root;
};

/**
 * Load SQL string from specified file asyncnously.
 * @param {string} name SQL file name
 * @returns {Promise<string>} SQL string
 */
SqlFileLoader.sqlAsync = function (name) {
  return new Promise((resolve, reject) => {
    if (_cache[name]) {
      return resolve(_cache[name]);
    }

    // Get filepath.
    var filepath = getFilePath(config.root, name);

    // Load SQL file
    fs.readFile(filepath, "utf-8", (err, text) => {
      if (err) {
        return reject(err);
      }
      _cache[name] = format(text);
      return resolve(_cache[name]);
    });
  });
};

/**
 * Load SQL string from specified file syncnously.
 * @param {string} name SQL file name
 * @returns {Promise<string>} SQL string
 */
SqlFileLoader.sqlSync = function (name) {
  if (_cache[name]) {
    return _cache[name];
  }

  // Get filepath.
  var filepath = getFilePath(config.root, name);

  // Load SQL file
  var text = fs.readFileSync(filepath, "utf-8");
  _cache[name] = format(text);

  return _cache[name];
};

SqlFileLoader.sql = SqlFileLoader.sqlAsync;
SqlFileLoader.loadAsync = loadAsync;
SqlFileLoader.loadSync = loadSync;

/**
 * @typedef {object}  SqlFileLoader
 * @property  {function}  sql  Asyncnously load SQL file. Synonym of "sqlAsync".
 * @property  {function}  sqlAsync Asyncnously load SQL file.
 * @property  {function}  sqlSync Syncnously load SQL file.
 */
module.exports = SqlFileLoader;