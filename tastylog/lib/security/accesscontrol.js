const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const {mysqlClient, sqlAsync} = require("../database/client");
const PRIVILEGE = {
  NORMAL: "normal"
};
const {
  ACCOUNT_LOCK_WINDOW,
  ACCOUNT_LOCK_THRESHOLD,
  ACCOUNT_LOCK_TIME,
  MAX_LOGIN_HISTORY
} = require("../../config/application.config").security;
const LOGIN_STATUS = {
  SUCCESS: 0,
  FAILURE: 1
};
const moment = require("moment");
const util = require("util");

// passport.use()で、Strategyの設定（configure）を行う
// ここでは passport-local の設定を行う
passport.use(
  // passport.authenticate で Strategyを参照するときの key
  // 指定しないと "local" が key になる
  "local-strategy",
  new LocalStrategy({
    // POSTの bodyに設定されるユーザ名のプロパティ名（デフォルトは "username"）
    usernameField: "username",
    // POSTの bodyに設定されるパスワードのプロパティ名（デフォルトは "password"）
    passwordField: "password",
    // trueにすると、VerifyFunctionの第一引数に req が追加される
    passReqToCallback: true
  },
  // VerifyFunction
  async (req, username, password, done) => {
    let tran;
    try {
      // トランザクション開始
      tran = await mysqlClient.beginTransaction();

      // アカウントの情報を取得
      const results = await mysqlClient.executeQuery(await sqlAsync("SELECT_USER_BY_EMAIL_FOR_UPDATE"), [username]);

      // アカウントの存在確認
      if (results.length !== 1) {
        // 認証失敗時は doneの第二引数に falseを指定する
        req.flash("error", "ユーザー名またはパスワードが間違っています。");
        req.flash("error", "入力内容を見直してください。");
        return done(null, false);
        // passport.authenticate の optionで failureFlash: true を指定していると、
        // 認証失敗時の done(null, false) の第三引数として、フラッシュメッセージを指定できる
        // ただし、直接 connect-flash を利用して req.flash を呼んだ方が応用がしやすそう。
        // 複数メッセージも簡単に設定できるし。
        // return done(null, false, {"message": "ユーザー名またはパスワードが間違っています"});
      }

      // 認証成功時は適切な user情報を doneの第二引数で返す
      const user = {
        id: results[0].id,
        name: results[0].name,
        email: results[0].email,
        permissions: [PRIVILEGE.NORMAL]
      };

      const now = new Date();
      // 保持件数上限を超えたログイン履歴の削除
      // ここで削除した後にログイン履歴が追加されるので、実際はMAX+1件の履歴が定常的に残る
      await tran.executeQuery(await sqlAsync("DELETE_LOGIN_HISTORY"), [
        user.id, 
        MAX_LOGIN_HISTORY]
      );

      // ハッシュ化したパスワード文字列との突合を行う
      if (!(await bcrypt.compare(password, results[0].password))) {
        // ログイン履歴の作成（失敗）
        await tran.executeQuery(await sqlAsync("INSERT_LOGIN_HISTORY"), [
          user.id, 
          now, 
          LOGIN_STATUS.FAILURE]
        );

        // 一定期間内のログイン失敗回数のカウント
        const failCounts = await tran.executeQuery(await sqlAsync("COUNT_LOGIN_HISTORY"), [
          user.id,
          LOGIN_STATUS.FAILURE,
          moment(now).subtract(ACCOUNT_LOCK_WINDOW, "minutes").toDate(),
          now
        ]);
        // 失敗回数が閾値以上ならばアカウントロックを行う
        if (failCounts.length === 1 && failCounts[0].count > ACCOUNT_LOCK_THRESHOLD) {
          await tran.executeQuery(await sqlAsync("UPDATE_USER_LOCKED"), [
            now,
            user.id
          ]);

          // トランザクション終了
          await tran.commit();
          req.flash("error", "パスワード試行回数が許容回数を超えました。");
          req.flash("error", "このアカウントはロックされます。");
          return done(null, false);
        }

        // トランザクション終了
        await tran.commit();
        req.flash("error", "ユーザー名またはパスワードが間違っています。");
        req.flash("error", "入力内容を見直してください。");
        return done(null, false);
      }

      // アカウントのロック状態の確認
      const locked = moment(results[0].locked);
      if (locked.isValid()) {
        if (locked.add(ACCOUNT_LOCK_TIME, "minutes").isSameOrAfter(moment(now))) {
          // アカウントロック状態
          // トランザクション終了
          await tran.commit();
          req.flash("error", "アカウントがロックされています。");
          req.flash("error", `${locked.format("YYYY/MM/DD HH:mm:ss")}までログインできません。`);
          return done(null, false);
        } else {
          // アカウントロックの解除
          await tran.executeQuery(await sqlAsync("UPDATE_USER_LOCKED"), [
            null,
            user.id
          ]);
        }
      }

      // ログイン履歴の作成（成功）
      await tran.executeQuery(await sqlAsync("INSERT_LOGIN_HISTORY"), [
        user.id, 
        now, 
        LOGIN_STATUS.SUCCESS]
      );

      // セッションハイジャック対策として sessionを再作成する
      const regenerate = util.promisify(req.session.regenerate).bind(req.session);
      await regenerate();

      // トランザクション終了
      await tran.commit();
      return done(null, user);

    } catch(err) {
      // ロールバックして終了
      await tran.rollback();
      return done(err);
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

// 認可処理
// Expressミドルウェア関数を返す
// ログイン状態かどうかを確認して、引数で指定した権限を保持しているか確認する
// （今回の実装ではログイン成功時の VerifyFunctionの中で user作成時に permissionsを設定している
// ログイン状態でない場合は、ログイン画面にリダイレクトする
const authorize = function(privilege) {
  return (req, res, next) => {
    if (req.isAuthenticated() &&
        (req.user.permissions || []).indexOf(privilege) >= 0) {
      next();
    } else {
      res.redirect("/account/login");
    }
  };
};

module.exports = {
  initialize,
  authenticate,
  authorize,
  PRIVILEGE
};