SELECT
	  id
  , name
  , email
  , password
  , description
  , created
  , updated
  , locked
FROM t_user
WHERE 1 = 1
	AND email = ?
ORDER BY id
;