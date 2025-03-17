import Product from "../models/product.js";
import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";

export const FindMany = asyncHandler(async (req, res) => {
  try {
    const pageSize = 9;
    const keyword = req.query.keyword
      ? { name: { $regex: req.query.keyword, $options: "i" } }
      : {};
    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword }).limit(pageSize);

    res.json({
      products,
      page: 1,
      pages: Math.ceil(count / pageSize),
      hasMore: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "server error" });
  }
});

export const findOne = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await Product.findById(id);

  if (data) {
    res.send(data);
  } else {
    res.status(500).send({ message: "Product not found with id " + id });
  }
});

export const fetchTopProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ sold: -1, rating: -1 })
      .limit(4);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(400).json(error.message);
  }
});

export const fetchNewProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 }).limit(4);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(400).json(error.message);
  }
});

export const fetchAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({})
    .populate("category")
    .sort({ createdAt: -1 });
  res.json(products);
});

export const addProductReview = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Cek apakah user sudah pernah mereview produk ini
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: "Product already reviewed" });
    }

    // Tambahkan review baru
    const review = {
      user: userId,
      name: req.user.username,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add review", error: error.message });
  }
});

export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    brand,
    quantity,
    category,
    description,
    price,
    countInStock,
    purchasePrice,
    weight,
  } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No images uploaded" });
  }

  const imagePaths = req.files.map((file) =>
    `/uploads/${file.filename}`.replace(/\\/g, "/")
  );

  const product = new Product({
    name,
    brand,
    quantity,
    category,
    description,
    countInStock,
    price,
    weight,
    purchasePrice,
    images: imagePaths,
  });

  await product.save();

  res.status(201).json({
    message: "Product created successfully",
    product,
  });
});

export const update = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      brand,
      quantity,
      category,
      description,
      price,
      countInStock,
      images,
      weight,
      purchasePrice
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.name = name;
    product.brand = brand;
    product.quantity = quantity;
    product.category = category;
    product.countInStock = countInStock;
    product.description = description;
    product.weight = weight;
    product.price = price;
    product.purchasePrice = purchasePrice;

    let updatedImages = images
      ? Array.isArray(images)
        ? images
        : [images]
      : product.images;

    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map((file) =>
        `/uploads/${file.filename}`.replace(/\\/g, "/")
      );
      updatedImages = [...updatedImages, ...imagePaths];
    }

    product.images = updatedImages;

    await product.save();

    res.json({
      message: "Product updated successfully!",
      product,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Failed to update product" });
  }
});

export const deleteImage = asyncHandler(async (req, res) => {
  const { productId, imagePath } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (!product.images.includes(imagePath)) {
    return res.status(400).json({ message: "Image not found in product" });
  }

  product.images = product.images.filter((img) => img !== imagePath);
  await product.save();

  const fileName = imagePath.replace(/^\/uploads\//, "");
  const filePath = path.join("uploads", fileName);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
      return res.status(500).json({ message: "Failed to delete image file" });
    }
  });

  res
    .status(200)
    .json({ message: "Image deleted successfully", images: product.images });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const deletedProduct = await Product.findByIdAndDelete(req.params.id);
  if (!deletedProduct) {
    return res.status(404).json({ message: "product not found" });
  }
  res.json({ message: "delete successfully", deletedProduct });
});

export const filterProducts = asyncHandler(async (req, res) => {
  try {
    const { checked, radio } = req.body;

    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };

    const products = await Product.find(args);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});
