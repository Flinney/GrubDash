const path = require("path");
const { prependOnceListener } = require("process");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//helper function
const areValidProps = require("../utils/areValidProps");

//middleware
const isValidDish = (req, res, next) => {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const validation = areValidProps("Dish", {
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  });
  if (!validation.bool) {
    return next({ status: 400, message: validation.message });
  }
  if (typeof price === "string") {
    return next({
      status: 400,
      message: `${price} is not a number for price.`,
    });
  }
  if (!parseInt(price) || parseInt(price) <= 0) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }

  next();
};

const isValidId = (req, res, next) => {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (!foundDish) {
    return next({ status: 404, message: `Dish does not exist: ${dishId}.` });
  }
  res.locals.dish = foundDish;
  next();
};

const doIdsMatch = (req, res, next) => {
  const { data: { id } = {} } = req.body;
  if (!id) {
    return next();
  }
  if (id !== res.locals.dish.id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${res.locals.dish.id}, Route: ${id}`,
    });
  }
  next();
};

//list
const list = (req, res, _next) => {
  res.json({ data: dishes });
};

//create
const create = (req, res, _next) => {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: parseInt(price),
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).send({ data: newDish });
};

//read
const read = (req, res, _next) => {
  res.json({ data: res.locals.dish });
};

//update
const update = (req, res, _next) => {
  const { data: { name, description, price, image_url } = {} } = req.body;
  res.locals.dish.name = name;
  res.locals.dish.description = description;
  res.locals.dish.price = price;
  res.locals.dish.image_url = image_url;
  res.json({ data: res.locals.dish });
};

module.exports = {
  list,
  create: [isValidDish, create],
  read: [isValidId, read],
  update: [isValidId, isValidDish, doIdsMatch, update],
};
