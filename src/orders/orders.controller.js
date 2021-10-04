const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//helper functions
const areValidProps = require("../utils/areValidProps");

function isValidArray(dishes) {
  return Array.isArray(dishes) && dishes.length > 0;
}

//Tests looking for index number in message, not place of dish on a list.
function hasQuantity(dishes) {
  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    const bool = dish.quantity && Number.isInteger(dish.quantity);
    if (!bool || dish.quantity <= 0) {
      return {
        bool: false,
        message: `Dish ${i} must have a quantity that is an integer greater than zero.`,
      };
    }
  }
  return { bool: true };
}

// TODO: Implement the /orders handlers needed to make the tests pass

//middleware
const isValidOrder = (req, res, next) => {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const validation = areValidProps("Order", {
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
  });
  if (!validation.bool) {
    return next({ status: 400, message: validation.message });
  }
  if (!isValidArray(dishes)) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
  const arrValidation = hasQuantity(dishes);
  if (!arrValidation.bool) {
    return next({ status: 400, message: arrValidation.message });
  }
  next();
};

const isValidId = (req, res, next) => {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (!foundOrder) {
    return next({ status: 404, message: `Order does not exist: ${orderId}.` });
  }
  res.locals.order = foundOrder;
  next();
};

const isValidStatus = (req, res, next) => {
  const { data: { status } = {} } = req.body;
  const validStatuses = ["pending", "preparing", "out-for-delivery"];
  if (!status || !validStatuses.includes(status)) {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered.`,
    });
  }
  if (status === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed; must have a different status`,
    });
  }
  next();
};

const isOrderPending = (req, res, next) => {
  if (res.locals.order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
};

const doIdsMatch = (req, res, next) => {
  const { data: { id } = {} } = req.body;
  if (!id) {
    return next();
  }
  if (id !== res.locals.order.id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${res.locals.order.id}, Route: ${id}`,
    });
  }
  next();
};

//list all orders
const list = (req, res, _next) => {
  res.json({ data: orders });
};

//create new order
const create = (req, res, _next) => {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).send({ data: newOrder });
};

//read existing order
const read = (req, res, _next) => {
  res.json({ data: res.locals.order });
};

//update existing order
const update = (req, res, _next) => {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const order = {
    ...res.locals.order,
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  res.json({ data: order });
};

//delete pending order
const destroy = (req, res, _next) => {
  const idx = orders.findIndex((order) => order.id === res.locals.order.id);
  orders.splice(idx, 1);
  res.sendStatus(204);
};

module.exports = {
  list,
  create: [isValidOrder, create],
  read: [isValidId, read],
  update: [isValidOrder, isValidStatus, isValidId, doIdsMatch, update],
  destroy: [isValidId, isOrderPending, destroy],
};
