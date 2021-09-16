SELECT properties.city AS city,
count(reservations.*) AS total_reservations
FROM properties 
JOIN reservations ON property_id=properties.id
GROUP BY properties.city
ORDER BY total_reservations DESC;