import asyncHandler from "express-async-handler";
import User from "../models/user.js";
import { json } from "express";

const WILAYAH_API_BASE = "https://wilayah.id/api";

export const getProvinces = asyncHandler(async (req, res) => {
  const response = await fetch(`${WILAYAH_API_BASE}/provinces.json`);
  const data = await response.json();
  res.json(data);
  res
    .status(500)
    .json({ message: "Failed get Provinces", error: error.message });
});

export const getCities = asyncHandler(async (req, res) => {
  const { provinceId } = req.params;

  const response = await fetch(
    `${WILAYAH_API_BASE}/regencies/${provinceId}.json`
  );
  const data = await response.json();
  res.json(data);
  res.status(500).json({ message: "Failed get city", error: error.message });
});

export const getDistricts = asyncHandler(async (req, res) => {
  const { cityId } = req.params;
  try {
    const response = await fetch(
      `${WILAYAH_API_BASE}/districts/${cityId}.json`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed get districts",
      error: error.message,
    });
  }
});

export const getVillages = asyncHandler(async (req, res) => {
  const { districtId } = req.params;
  try {
    const response = await fetch(
      `${WILAYAH_API_BASE}/villages/${districtId}.json`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed get villages",
      error: error.message,
    });
  }
});

export const getShippingAddress = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ shippingAddress: user.shippingAddress });
  } catch (error) {
    res.status(500).json({ message: "Error fetching shipping address", error });
  }
};

export const saveShippingAddress = asyncHandler(async (req, res) => {
  const {
    _id,
    recipient,
    province,
    city,
    district,
    village,
    postalCode,
    detail_address,
  } = req.body;

  if (
    !recipient ||
    !province ||
    !city ||
    !district ||
    !postalCode ||
    !detail_address ||
    !village
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await User.findById(_id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const newAddress = {
    recipient,
    province,
    city,
    district,
    village,
    postalCode,
    detail_address,
  };

  if (user.shippingAddress.length === 0) {
    user.shippingAddress.push(newAddress);
  } else {
    user.shippingAddress[0] = newAddress;
  }

  await user.save();


  res.status(200).json({
    shipping: [user.shippingAddress[0]],
  });
});