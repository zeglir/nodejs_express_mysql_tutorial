SELECT
	COUNT(*) AS `count`
FROM t_login_history
WHERE 1 = 1
	AND user_id = ?
  AND status = ?
  AND login BETWEEN ? AND ?
;