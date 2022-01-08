const path = require("path");
// const LOG_ROOT_DIR = process.env.LOG_ROOT_DIR || path.join(__dirname, "../logs");
// pkgでビルドした実行可能ファイルと同じ場所の配下に出力する
// __dirnameの場合、仮想ディレクトリが取得されるため、配下に出力できずエラーになる
const LOG_ROOT_DIR = process.env.LOG_ROOT_DIR || path.join(process.cwd(), "./logs");

module.exports = {
  appenders: {
    consoleAppender: {
      type: "console"
    },
    appAppender: {
      // enableCallStack: trueの場合は、スタックトレースの情報（%s %f %l %o）を含むレイアウトを設定する
      // layout: { type: "pattern", pattern: "[%d] %p %c - %m%n%f %l %o%n%s" },
      type: "dateFile",
      filename: path.join(LOG_ROOT_DIR, "application.log"),
      pattern: "yyyyMMdd",
      daysToKeep: 7
    },
    accessAppender: {
      type: "dateFile",
      filename: path.join(LOG_ROOT_DIR, "access.log"),
      pattern: "yyyyMMdd",
      daysToKeep: 7
    }
  },
  categories: {
    // defaultカテゴリは必須
    default: {
      appenders: ["consoleAppender"],
      level: "ALL"
    },
    application: {
      // enableCallStack: true,
      appenders: ["consoleAppender", "appAppender"],
      level: "INFO"
    },
    access: {
      appenders: ["consoleAppender", "accessAppender"],
      level: "INFO"
    }
  }
};