import { useState } from "react";
import { Link } from "react-router-dom";
import { useAllProductsQuery } from "../../redux/api/productApiSlice";
import Loader from "../../components/loader";
import { addToCart } from "../../redux/features/cart/cartSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

const AllProducts = () => {
    const { data: products, isLoading, isError } = useAllProductsQuery();
    const [searchTerm, setSearchTerm] = useState("");
    const dispatch = useDispatch();

    if (isLoading) {
        return <Loader />;
    }

    if (isError) {
        return <div>Error loading products</div>;
    }

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addToCartHandler = (product, qty) => {
        dispatch(addToCart({ ...product, qty }));
        toast.success("Item added successfully");
    };

    return (
        <>
            <div className="container mx-[12rem]">
                <div className="flex flex-col md:flex-row">
                    <div className="p-3">
                        <div className="ml-[2rem] text-xl font-bold h-12 text-gray-950">
                            All Products ({filteredProducts.length})
                        </div>
                        <div className="mb-4 ml-[2rem] w-full">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="p-2 border rounded-lg w-full md:w-1/3 bg-neutral-800 text-gray-100"
                            />
                        </div>
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-xl text-black ml-[5rem]">No products found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredProducts.map((product) => (
                                <div
                                    key={product._id}
                                    className="border rounded-lg shadow-lg p-4 mb-4 overflow-hidden bg-neutral-700 h-full flex flex-col"
                                >
                                    <div className="flex flex-col flex-grow">
                                        <img
                                            src={product?.images?.[0]}
                                            alt={product.name}
                                            className="w-full h-48 object-cover mb-4 rounded-lg"
                                        />
                                        <div className="flex flex-col flex-grow">
                                            <h5 className="text-xl font-semibold mb-2">
                                                {product?.name.substring(0, 40)}
                                            </h5>
                                            <p className="text-gray-100 text-lg mb-4">
                                                Rp{new Intl.NumberFormat('id-ID').format(product?.price)}
                                            </p>
                                            <div className="flex justify-between items-center mb-4">
                                                <Link
                                                    to={`/admin/product/update/${product._id}`}
                                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-orange-700 rounded-lg hover:bg-orange-800 focus:ring-4 focus:outline-none focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
                                                >
                                                    Update Product
                                                    <svg
                                                        className="w-3.5 h-3.5 ml-2"
                                                        aria-hidden="true"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 14 10"
                                                    >
                                                        <path
                                                            stroke="currentColor"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M1 5h12m0 0L9 1m4 4L9 9"
                                                        />
                                                    </svg>
                                                </Link>
                                                <p className="text-gray-100">
                                                    Stock: {product?.countInStock}
                                                </p>
                                            </div>
                                            <button
                                                className={`inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors ${product.countInStock === 0
                                                        ? "bg-gray-500 cursor-not-allowed"
                                                        : "bg-green-600 hover:bg-green-700"
                                                    }`}
                                                onClick={() => addToCartHandler(product, 1)}
                                                disabled={product.countInStock === 0}
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="md:w-1/4 p-3 mt-2">
                    </div>
                </div>
            </div>
        </>
    );
};

export default AllProducts;