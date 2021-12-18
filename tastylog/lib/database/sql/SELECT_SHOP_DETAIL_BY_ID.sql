SELECT
		t_shop.id AS id
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
	, MAX(t_shop.geolocation_latitude) AS geolocation_latitude
	, MAX(t_shop.geolocation_longitude) AS geolocation_longitude
	, group_concat(m_category.name separator ", ") AS `categories` -- 集約したcategory名をカンマ区切りで表示する
FROM t_shop
	LEFT OUTER JOIN t_shop_category
  ON t_shop.id = t_shop_category.shop_id
		LEFT OUTER JOIN m_category
    ON t_shop_category.category_id = m_category.id
WHERE 1 = 1
 	AND t_shop.id = ?
GROUP BY
	t_shop.id -- 1つのshopに複数categoryが紐づくので集約
ORDER BY
	t_shop.id
;