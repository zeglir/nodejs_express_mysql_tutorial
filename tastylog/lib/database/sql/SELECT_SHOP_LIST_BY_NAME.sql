SELECT 
	*
FROM (
	SELECT
			ROW_NUMBER() OVER(ORDER BY MAX(t_shop.score) DESC, t_shop.id) AS `row_num`
		, t_shop.id AS id
		, MAX(t_shop.name) AS name
		, MAX(t_shop.kana) AS kana
		, MAX(t_shop.post_code) AS post_code
		, MAX(t_shop.address) AS address
		, MAX(t_shop.tel) AS tel
		, MAX(t_shop.holiday) AS holiday
		, MAX(t_shop.seats) AS seats
		, MAX(t_shop.price_range) AS price_range
		, MAX(t_shop.score) AS score
		, MAX(t_shop.status) AS status
		, GROUP_CONCAT(m_category.name separator ", ") AS categories
	FROM t_shop
		LEFT OUTER JOIN t_shop_category
		ON t_shop.id = t_shop_category.shop_id
			LEFT OUTER JOIN m_category
			ON t_shop_category.category_id = m_category.id
  WHERE 1 = 1
    AND t_shop.name LIKE ?
	GROUP BY
		t_shop.id
) main
WHERE 1 = 1
  AND row_num >= ?
	AND row_num <= ?
ORDER BY
	row_num
;
