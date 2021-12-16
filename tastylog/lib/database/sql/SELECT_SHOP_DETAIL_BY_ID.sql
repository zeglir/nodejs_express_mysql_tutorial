SELECT
	t_shop.id,
	t_shop.name,
	t_shop.kana,
	t_shop.post_code,
	t_shop.address,
	t_shop.tel,
	t_shop.holiday,
	t_shop.seats,
	t_shop.price_range,
	t_shop.score,
	t_shop.status,
	t_shop.geolocation_latitude,
	t_shop.geolocation_longitude,
	group_concat(m_category.name separator ", ") AS categories -- 集約したcategory名をカンマ区切りで表示する
FROM t_shop
	LEFT OUTER JOIN t_shop_category
  ON t_shop.id = t_shop_category.shop_id
		LEFT OUTER JOIN m_category
    ON t_shop_category.category_id = m_category.id
WHERE 1 = 1
	AND t_shop.id = ?
GROUP BY
	t_shop_category.shop_id -- 1つのshopに複数categoryが紐づくので集約
;