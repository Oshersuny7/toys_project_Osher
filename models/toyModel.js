const mongoose = require("mongoose");
const Joi = require("joi");

const toySchema = new mongoose.Schema(
  {
    name: String,
    info: String,
    img_url: String,
    price: Number,
    category: String,
    user_id: String,
  },
  { timestamps: true }
);

exports.ToyModel = mongoose.model("toys", toySchema);

exports.validateToy = (_reqBody) => {
  const joiSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    info: Joi.string().min(2).max(500).required(),
    price: Joi.number().min(1).max(9999).required(),
    img_url: Joi.string().min(2).max(400).allow(null, ""),
    category: Joi.string().min(2).max(500).required(),
  });
  return joiSchema.validate(_reqBody);
};
