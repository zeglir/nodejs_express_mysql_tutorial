const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const {mysqlClient, sqlAsync} = require("../database/client");
const PRIVILEGE = {
  NORMAL: "normal"
};

passport.use(
  // passport.authenticate で Strategyを参照すつときの key
  // 指定しないと "local" が key になる
  "local-strategy",
  new LocalStrategy({
    usernameField: "username",
    passwordField: "password",
    // trueにすると、VerifyFunctionの第一引数に req が追加される
    passReqToCallback: true
  },
  // VerifyFunction
  async (req, username, password, done) => {
    let results;
    try {
      results = await mysqlClient.executeQuery(await sqlAsync("SELECT_USER_BY_EMAIL"), [username]);
    } catch(err) {
      return done(err);
    }

    if (results.length === 1 && results[0].password === password) {
      const user = {
        id: results[0].id,
        name: results[0].name,
        email: results[0].email,
        permissions: [PRIVILEGE.NORMAL]
      };
      return done(null, user);
    } else {
      req.flash("error", "ユーザー名またはパスワードが間違っています。");
      req.flash("error", "入力内容を見直してください。");
      return done(null, false);
      // passport.authenticate の optionで failureFlash: true を指定していると、
      // 認証失敗時の done(null, false) の第三引数として、フラッシュメッセージを指定できる
      // ただし、直接 connect-flash を利用して req.flash を呼んだ方が応用がしやすそう。
      // 複数メッセージも簡単に設定できるし。
      // return done(null, false, {"message": "ユーザー名またはパスワードが間違っています"});
    }
  })
);

// passport.js の認証成功時に、セッションにユーザ情報を格納するためにコールバックされる
// ここではユーザ情報 user を丸ごとスルーパスしているが、
// ユーザのID user.id だけ格納するなどの処理をいれることもできる
passport.serializeUser((user, done) => {
  // 第一引数がerror情報で、第二引数がsessionに保存されるユーザ情報
  done(null, user);
});

// セッションからユーザ情報を復元して req.user に格納するときにコールバックされる
// serializeUser時に user丸ごと格納しているため、deserialize時もスルーパスしている
// sessionにユーザIDだけを持たせた場合、ユーザIDからユーザ情報を復元する処理をここに実装することになる
passport.deserializeUser((user, done) => {
  // 第一引数がerror情報で、第二引数がreq.user に保存されるユーザ情報
  done(null, user);
});

// passport.js の初期化用ミドルウェアを配列でまとめて返却する
const initialize = function() {
  return [
    // Expressで passport.jsを使うための初期化処理
    passport.initialize(),
    // sessionにログイン情報を保存するための初期化処理
    passport.session(),
    // ログイン状態をテンプレート（EJS）で知るためのお便利ミドルウェア
    (req, res, next) => {
      // ログイン状態の場合、passportによって req.userにユーザが設定されるため、
      // それを EJSに引き渡す
      if (req.user) {
        res.locals.user = req.user;
      }
      next();
    }
  ];
};

// passport.jsで認証を行うミドルウェア関数を返す
const authenticate = function() {
  return passport.authenticate(
    // passport.use で Strategyとともに設定した key
    // passport.use で key を指定していない場合、"local" で参照できる
    "local-strategy",
    {
      // 認証成功時・失敗時のリダイレクト先
      successRedirect: "/account",
      failureRedirect: "/account/login",
      // true にすると、認証失敗時に connec-flashによるフラッシュメッセージが利用できる
      // verifyFunctionにおいて、done の第三引数にフラッシュメッセージを設定できる
      // done(null, false, {"message": "認証失敗時のメッセージ"});
      failureFlash: true
    }
  );
};

const authorize = function() {

};

module.exports = {
  initialize,
  authenticate,
  authorize,
  PRIVILEGE
};