const express = require("express");
const { auth } = require("../middlewares/auth");
const { validateToy, ToyModel } = require("../models/toyModel");
const router = express.Router();

//Routes A+B+C- domain/toys/?page + domain/toys/?page/search?s +domain/toys/category/:catname?page
router.get("/", async (req, res) => {
  try {
    // Query parameters
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const sort = req.query.sort || "_id";
    const reverse = req.query.reverse == "yes" ? 1 : -1;
    const searchText = req.query.s || "";
    const category = req.query.category || "";

    let filterFind = {};

    // Make the search query case-insensitive
    if (searchText) {
      const searchExp = new RegExp(searchText, "i");
      filterFind.$or = [
        { name: { $regex: searchExp } },
        { info: { $regex: searchExp } },
      ];
    }

    // Make the category filter case-insensitive
    if (category) {
      filterFind.category = { $regex: new RegExp(category, "i") };
    }

    const count = await ToyModel.countDocuments(filterFind);

    const data = await ToyModel.find(filterFind)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ [sort]: reverse });

    res.json({ data, count, page, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});
//Route D- domain/toys/ adding toy (only connected user is allowed by id)
router.post("/", auth, async (req, res) => {
  const validBody = validateToy(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    const toy = new ToyModel(req.body);
    toy.user_id = req.tokenData._id;
    await toy.save();
    res.status(201).json(toy);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});
//Route E- domain/toys/:editId (only connected user is allowed by id)
router.put("/:editId", auth, async (req, res) => {
  const validBody = validateToy(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    const id = req.params.editId;
    if (req.tokenData.role === "user") {
      const data = await ToyModel.updateOne(
        { _id: id, user_id: req.tokenData._id },
        req.body
      );
      res.json(data);
    } else if (req.tokenData.role === "admin") {
      const data = await ToyModel.updateOne({ _id: id }, req.body);
      res.json(data);
    }
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});
//Route F- domain/toys/:delId (only connected user is allowed by id)
router.delete("/:delId", auth, async (req, res) => {
  try {
    const id = req.params.delId;
    if (req.tokenData.role === "user") {
      const data = await ToyModel.deleteOne({
        _id: id,
        user_id: req.tokenData._id,
      });
      res.json(data);
    } else if ((req.tokenData, role === "admin")) {
      const data = await ToyModel.deleteOne({ _id: id }, req.body);
    }
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});
//Route G - domain/toys/prices?min=X&max=X&page=X
router.get("/prices", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const page = parseInt(req.query.page) || 1; // Start from page 1
    const minPrice = parseInt(req.query.min);
    const maxPrice = parseInt(req.query.max);

    if (!minPrice || !maxPrice) {
      return res
        .status(400)
        .json({ error: "Both 'min' and 'max' price parameters are required." });
    }

    const searchText = req.query.searchText || "";
    const searchExp = new RegExp(searchText, "i");
    const filterFind = {
      $or: [{ title: searchExp }, { info: searchExp }],
      price: { $gte: minPrice, $lte: maxPrice },
    };

    const toysInCategory = await ToyModel.find(filterFind)
      .find(filter)
      .collation({ locale: "en", strength: 1 })
      .skip((page - 1) * limit)
      .limit(perPage);

    res.json(toysInCategory);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});
//Route H - domain/toys/single/:id
router.get("/single/:id", async (req, res) => {
  try {
    const toyId = req.params.id;

    if (!toyId) {
      return res.status(400).json({ error: "Toy ID parameter is missing." });
    }
    const toy = await ToyModel.findById(toyId);

    if (!toy) {
      return res.status(404).json({ error: "Toy not found." });
    }

    res.json(toy);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});
//Route I - domain/toys/count
router.get("/count", async(req,res) => {
  try{
    const limit = req.query.limit || 5;
    const count = await ToyModel.countDocuments({})
    res.json({count,pages:Math.ceil(count/limit)})
  }
  catch(err){
    console.log(err);
    res.status(502).json({err})
  }
})

module.exports = router;
