module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es2021": true,
    "node": true,
    "jquery": true
  },
  "parserOptions": {
    "ecmaVersion": 13
  },
  "extends": "eslint:recommended",
  "rules": {
    // インデントはスペース2個
    "indent" : [
      "error", 2, {"SwitchCase": 1}
    ],
    // 文字列クォートは ""
    "quotes": [
      "error", "double"
    ],
    // 文末セミコロンは必須
    "semi": [
      "error", "always"
    ],
    // 利用されない変数はエラー、関数の引数はチェックなし
    "no-unused-vars": [
      "error", {"vars": "all", "args": "none"}
    ],
    // consoleオブジェクトを利用する（offなら無くてよいのでは）
    "no-console": "off"
  }
};
