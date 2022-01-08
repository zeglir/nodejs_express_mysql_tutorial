UPDATE t_user
SET
  locked = ?
WHERE 1 = 1
  AND id = ?
;