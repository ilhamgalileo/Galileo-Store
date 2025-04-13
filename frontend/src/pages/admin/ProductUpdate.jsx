import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useDeleteProductMutation,
  useGetProductByIdQuery,
  useUploadProductImageMutation,
  useUpdateProductMutation,
  useDeleteProductImageMutation,
} from "../../redux/api/productApiSlice";
import { useFetchCateQuery } from "../../redux/api/categoryApiSlice";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const ProductUpdate = () => {
  const params = useParams();
  const navigate = useNavigate();

  const { data: productData } = useGetProductByIdQuery(params.id);
  const { data: categories = [] } = useFetchCateQuery();
  const { userInfo } = useSelector((state) => state.auth);
  const [uploadProductImage] = useUploadProductImageMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [deleteImage] = useDeleteProductImageMutation();

  const [newFiles, setNewFiles] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    brand: "",
    quantity: "",
    countInStock: "",
    weight: "",
    purchasePrice: "",
    images: [],
  });
  const [loading, setLoading] = useState(false);

  const formatToRupiah = (value) => {
    if (!value) return "Rp ";
    return `Rp ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const removeRupiahFormat = (value) => {
    if (!value) return "";
    return value.replace(/[^0-9]/g, "");
  };

  const calculatePrice = (purchasePrice) => {
    const profit = purchasePrice * 0.08;
    const price = Number(purchasePrice) + profit;
    return price;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "purchasePrice") {
      const numericValue = removeRupiahFormat(value);
      const price = calculatePrice(numericValue);

      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
        price: price.toString(),
      }));
    } else if (name === "price") {
      const numericValue = removeRupiahFormat(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  useEffect(() => {
    if (productData && productData._id) {
      setFormData((prev) => ({
        ...prev,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category,
        brand: productData.brand,
        quantity: productData.quantity,
        countInStock: productData.countInStock,
        weight: productData.weight,
        purchasePrice: productData.purchasePrice,
        images: productData.images || [],
      }));
    }
  }, [productData]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedImagePaths = [];

      if (newFiles.length > 0) {
        const uploadFormData = new FormData();
        newFiles.forEach((file) => uploadFormData.append("images", file));

        const uploadResponse = await uploadProductImage(uploadFormData).unwrap();
        uploadedImagePaths = uploadResponse.images || [];
      }

      const updatedImages = [
        ...formData.images.filter((img) => typeof img === "string" && img.startsWith("/uploads/")),
        ...uploadedImagePaths,
      ];

      const productFormData = new FormData();
      productFormData.append("name", formData.name);
      productFormData.append("description", formData.description);
      productFormData.append("price", formData.price);
      productFormData.append("category", formData.category);
      productFormData.append("brand", formData.brand);
      productFormData.append("quantity", formData.quantity);
      productFormData.append("countInStock", formData.countInStock);
      productFormData.append("weight", formData.weight);
      productFormData.append("purchasePrice", formData.purchasePrice);

      updatedImages.forEach((path) => {
        productFormData.append("images[]", path);
      });

      const data = await updateProduct({
        productId: params.id,
        formData: productFormData,
      }).unwrap();

      toast.success("Product updated successfully");
      navigate("/admin/allproductslist");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imagePath) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    try {
      await deleteImage({
        productId: params.id,
        imagePath,
      }).unwrap();

      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img !== imagePath),
      }));

      toast.success("Image deleted successfully");
    } catch (err) {
      console.error("Error deleting image:", err);
      toast.error(err?.data?.message || "Failed to delete image");
    }
  };

  const uploadFileHandler = (e) => {
    const files = Array.from(e.target.files);

    setNewFiles((prev) => [...prev, ...files]);

    const previewUrls = files.map((file) => URL.createObjectURL(file));

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...previewUrls],
    }));

    toast.success("Images added successfully");
  };

  const deleteHandler = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    setLoading(true);
    try {
      await deleteProduct(params.id).unwrap();
      toast.success("Product deleted successfully");
      navigate("/admin/allproductslist");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container xl:mx-[9rem] sm:mx-[0]">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-3/4 p-3 text-gray-950">
          <h2 className="h-12">Update Product</h2>
          <form onSubmit={submitHandler}>
            <div className="mb-3">
              <label className="border border-gray-800 text-black px-4 block w-full text-center rounded-lg cursor-pointer font-bold py-11">
                {loading ? "Uploading..." : "Upload Images"}
                <input
                  type="file"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={uploadFileHandler}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>

            {formData.images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative w-[10rem] h-[10rem]">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleDeleteImage(image)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      type="button"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="p-4 w-full border rounded-lg bg-[#101011] text-white"
                  required
                />
              </div>

              {userInfo.user?.isAdmin ? (
                <div>
                  <label htmlFor="purchasePrice">Purchase Price</label>
                  <input
                    type="text"
                    name="purchasePrice"
                    value={formatToRupiah(formData.purchasePrice)}
                    onChange={handleInputChange}
                    className="p-4 w-full border rounded-lg bg-gray-500 text-white"
                    required
                    disabled
                  />
                </div>
              ) : userInfo.user?.isSuperAdmin && (
                <div>
                  <label htmlFor="purchasePrice">Purchase Price</label>
                  <input
                    type="text"
                    name="purchasePrice"
                    value={formatToRupiah(formData.purchasePrice)}
                    onChange={handleInputChange}
                    className="p-4 w-full border rounded-lg bg-[#101011] text-white"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="quantity">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="p-4 w-full border rounded-lg bg-[#101011] text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="brand">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="p-4 w-full border rounded-lg bg-[#101011] text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="countInStock">Count In Stock</label>
                <input
                  type="number"
                  name="countInStock"
                  value={formData.countInStock}
                  onChange={handleInputChange}
                  className="p-4 w-full border rounded-lg bg-[#101011] text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="category">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="p-4 w-full border rounded-lg bg-[#101011] text-white"
                  required
                >
                  <option value="">Choose Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="weight">Weight</label>
                <div className="flex items-center">
                  <input
                    name="weight"
                    type="number"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="p-4 mb-3 w-[10rem] border rounded-lg bg-[#101011] text-white"
                    required
                  />
                  <span className="ml-2 text-gray-950">gr</span>
                </div>
              </div>

              <div>
                <label htmlFor="price">Price</label>
                <input
                  type="text"
                  name="price"
                  value={formatToRupiah(formData.price)}
                  onChange={handleInputChange}
                  className="p-4 w-full border rounded-lg bg-[#101011] text-white"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="description">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="p-4 w-full border rounded-lg bg-[#101011] text-white"
                rows="4"
                required
              />
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="py-4 px-10 rounded-lg text-lg font-bold bg-green-600 text-white disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update"}
              </button>
              <button
                type="button"
                onClick={deleteHandler}
                className="py-4 px-10 rounded-lg text-lg font-bold bg-orange-600 text-white disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductUpdate;