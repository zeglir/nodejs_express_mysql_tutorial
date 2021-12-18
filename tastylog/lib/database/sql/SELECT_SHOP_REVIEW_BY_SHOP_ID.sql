SELECT
		t_review.id
  , t_review.score
  , t_review.visit
  , t_review.post
  , t_review.description
  , t_user.id AS `user_id`
  , t_user.name AS `user_name`
FROM t_review
	LEFT OUTER JOIN t_user
  ON t_review.user_id = t_user.id
WHERE 1 = 1
	AND t_review.shop_id = ?
;