UPDATE t_shop
SET
	score = (
		SELECT ROUND(AVG(score),2) FROM t_review
    WHERE 1 = 1
			AND shop_id = ?
		GROUP BY shop_id
  )
WHERE 1 = 1
	AND id = ?
;