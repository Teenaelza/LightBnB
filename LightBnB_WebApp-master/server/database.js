const { Pool } = require("pg");
const pool = new Pool({
  user: "vagrant",
  password: "123",
  host: "localhost",
  database: "lightbnb",
});
const properties = require("./json/properties.json");
const users = require("./json/users.json");

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const values = [email.toLowerCase()];
  return pool
    .query(
      `SELECT *
      FROM users 
      WHERE LOWER(email)=$1`,
      values
    )
    .then((res) => {
      if (res.rowCount === 0) {
        return null;
      }
      return res.rows[0];
    })
    .catch((err) => err.message);
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const values = [id];
  return pool
    .query(
      `SELECT *
      FROM users 
      WHERE id=$1`,
      values
    )
    .then((res) => {
      if (res.rowCount === 0) {
        return null;
      }
      return res.rows[0];
    })
    .catch((err) => err.message);
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  values = [user.name, user.email, user.password];
  return pool
    .query(
      `INSERT INTO users (name,email,password) 
    VALUES ($1,$2,$3)
    RETURNING *`,
      values
    )
    .then((res) => res.rows[0])
    .catch((err) => err.message);
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(
      `SELECT reservations.*,properties.*,AVG(property_reviews.rating) AS average_rating
      FROM properties 
      JOIN reservations ON reservations.property_id=properties.id
      JOIN property_reviews ON property_reviews.reservation_id=reservations.id
      WHERE reservations.guest_id = $1 
      AND reservations.end_date < now()::date
      GROUP BY properties.id, reservations.id
      ORDER BY reservations.start_date 
      LIMIT $2`,
      [guest_id, limit]
    )
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      return err.message;
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const values = [];
  let queryString = `SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id WHERE 1=1`;
  if (options) {
    if (options.city) {
      values.push(`%${options.city}%`);
      queryString += ` AND city LIKE $${values.length} `;
    }
    if (options.owner_id) {
      values.push(options.owner_id);
      queryString += ` AND owner_id = $${values.length} `;
    }
    if (options.minimum_price_per_night) {
      values.push(options.minimum_price_per_night);
      queryString += ` AND cost_per_night/100 >= $${values.length} `;
    }
    if (options.maximum_price_per_night) {
      values.push(options.maximum_price_per_night);
      queryString += `AND cost_per_night/100 <= $${values.length} `;
    }
    if (options.minimum_rating) {
      values.push(options.minimum_rating);
      queryString += `AND property_reviews.rating >= $${values.length} `;
    }
  }
  values.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${values.length};
  `;
  return pool
    .query(queryString, values)
    .then((res) => {
      return res.rows;
    })
    .catch((err) => {
      return err.message;
    });
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  console.log(property);
  values = [
    parseInt(property.owner_id),
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    parseInt(property.cost_per_night),
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    parseInt(property.parking_spaces),
    parseInt(property.number_of_bathrooms),
    parseInt(property.number_of_bedrooms),
  ];
  return pool
    .query(
      `INSERT INTO properties (owner_id,title,description,thumbnail_photo_url,cover_photo_url,cost_per_night,street,city,province,post_code,country,parking_spaces,number_of_bathrooms,number_of_bedrooms) 
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING *`,
      values
    )
    .then((res) => res.rows[0])
    .catch((err) => err.message);
};
exports.addProperty = addProperty;
