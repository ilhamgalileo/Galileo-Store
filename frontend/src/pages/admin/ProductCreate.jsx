import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateProductMutation,
} from "../../redux/api/productApiSlice";
import { useFetchCateQuery } from "../../redux/api/categoryApiSlice";
import { toast } from "react-toastify";
import Loader from "../../components/loader";

const ProductCreate = () => {
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
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
  const navigate = useNavigate();

  const [createProduct] = useCreateProductMutation();
  const { data: categories } = useFetchCateQuery();

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

  const uploadFileHandler = (e) => {
    const files = Array.from(e.target.files);
    const previewUrls = files.map((file) => URL.createObjectURL(file));

    setImages((prev) => [...prev, ...previewUrls]);
    setImageFiles((prev) => [...prev, ...files]);
    toast.success("Images added successfully");
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    setImages(newImages);
    setImageFiles(newImageFiles);
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (imageFiles.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("brand", formData.brand);
      formDataToSend.append("quantity", formData.quantity);
      formDataToSend.append("countInStock", formData.countInStock);
      formDataToSend.append("weight", formData.weight);
      formDataToSend.append("purchasePrice", formData.purchasePrice);

      imageFiles.forEach((file) => {
        formDataToSend.append("images", file);
      });

      const data = await createProduct(formDataToSend).unwrap();

      if (data) {
        toast.success(`${data.product.name} created successfully`);
        navigate("/admin/allproductslist");
      } else {
        toast.error("Failed to create product");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error?.data?.message || "Product creation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      images.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  return (
    <div className="container xl:mx-[9rem] sm:mx-[0]">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-3/4 p-3 text-gray-950">
          <h2 className="h-12">Create Product</h2>
          <form onSubmit={submitHandler}>
            <div className="mb-3">
              <label
                className={`border border-gray-800 text-black px-4 block w-full text-center rounded-lg cursor-pointer font-bold py-11 ${loading ? "opacity-50" : ""
                  }`}
              >
                {loading ? (
                  <Loader />
                ) : images.length > 0 ? (
                  `${images.length} selected`
                ) : (
                  "Upload Images"
                )}
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

            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {images.map((image, index) => (
                  <div key={index} className="relative w-[10rem] h-[10rem]">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {!loading && (
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        type="button"
                      >
                        ×
                      </button>
                    )}
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
                  {categories?.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Don't see your category?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/admin/category")}
                    className="text-blue-500 hover:underline"
                  >
                    Add a new category
                  </button>
                </p>
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
                {loading ? "Creating..." : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductCreate; 