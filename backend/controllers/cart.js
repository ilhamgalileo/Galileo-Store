import Cart from '../models/cart.js'
import Product from '../models/product.js'
import asyncHandler from 'express-async-handler'

export const getCart = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const cart = await Cart.findOne({ userId }).populate('products.productId')

    if (!cart) {
      return res.status(404).send({ message: 'anda belum memiliki keranjang' })
    }
    res.send(cart)
})

export const addProduct = asyncHandler(async (req, res) => {
  const { sku, quantity } = req.body
  const { _id } = req.user

    const product = await Product.findOne({ sku })
    if (!product) {
      return res.status(404).send({ message: 'Produk tidak tersedia' })
    }

    if (quantity > product.stock) {
      return res.status(400).send({ message: 'Jumlah produk melebihi stok yang tersedia' })
    }

    let cart = await Cart.findOne({ userId: _id })

    if (!cart) {
      cart = new Cart({
        userId: _id,
        products: [{ productId: product._id, quantity }]
      })
    } else {
      const productIndex = cart.products.findIndex(item => item.productId.toString() === product._id.toString())

      if (productIndex > -1) {
        const newQuantity = cart.products[productIndex].quantity + quantity

        if (newQuantity > product.stock) {
          return res.status(400).send({ message: 'Jumlah total produk melebihi stok yang tersedia' })
        }

        cart.products[productIndex].quantity = newQuantity
      } else {
        cart.products.push({ productId: product._id, quantity })
      }
    }

    await cart.save()
    res.status(201).send(cart)
})

export const removeCart = asyncHandler(async (req, res) => {
  const {_id} = req.user
  const { cartId } = req.params

    const cart = await Cart.findOneAndDelete({ _id: cartId, userId: _id })

    if (!cart) {
      return res.status(404).send({ message: 'Keranjang tidak ditemukan' })
    }

    res.send({ message: 'Keranjang dan semua produk di dalamnya telah dihapus', cart })
})
