-- 保持件数上限を超えたレコードを削除する
DELETE FROM t_login_history main
WHERE 1 = 1
	AND EXISTS (
		SELECT 1 FROM (
			SELECT
					ROW_NUMBER() OVER(ORDER BY login DESC) rownum
        , user_id
        , login
			FROM t_login_history
			WHERE user_id = ?
		) sub
		WHERE 1 = 1
			AND sub.rownum > ?
			AND main.user_id = sub.user_id
			AND main.login = sub.login
  )
;