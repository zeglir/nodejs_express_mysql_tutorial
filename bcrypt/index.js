const bcrypt = require("bcrypt");
const PASSWORD = process.argv[2] || "Passw0rd";

(async () => {
  // salt の生成
  const salt = await bcrypt.genSalt(10, "b");
  // パスワード文字列をハッシュ化
  const hash = await bcrypt.hash(PASSWORD, salt);
  console.log(`${PASSWORD} => ${hash}`);
})();