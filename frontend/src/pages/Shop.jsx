import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useGetFilterProductsQuery } from "../redux/api/productApiSlice"
import { setCategories, setProducts, setChecked, setSelectedBrand } from "../redux/features/shop/shopSlice"
import Loader from "../components/loader"
import { useFetchCateQuery } from "../redux/api/categoryApiSlice"
import ProductCard from "./Products/ProductCard"

const Shop = () => {
  const dispatch = useDispatch()
  const { categories, products, checked, radio } = useSelector((state) => state.shop)
  const [selectedBrands, setSelectedBrands] = useState([])

  const categoriesQuery = useFetchCateQuery()
  const [priceFilter, setPriceFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProductsQuery = useGetFilterProductsQuery({ checked, radio })

  useEffect(() => {
    if (!categoriesQuery.isLoading) {
      dispatch(setCategories(categoriesQuery.data))
    }
  }, [categoriesQuery.data, dispatch])

  useEffect(() => {
    if (!checked.length || !radio.length) {
      if (!filteredProductsQuery.isLoading) {
        const filteredProducts = filteredProductsQuery.data.filter(
          (product) => {
            const matchesPrice =
              product.price.toString().includes(priceFilter) ||
              product.price === parseInt(priceFilter, 10)
            const matchesName =
              product.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesBrand =
              selectedBrands.length === 0 || selectedBrands.includes(product.brand)
            return matchesPrice && matchesName && matchesBrand
          }
        )
        dispatch(setProducts(filteredProducts))
      }
    }
  }, [checked, radio, filteredProductsQuery.data, dispatch, priceFilter, searchTerm, selectedBrands])

  const handleBrandCheck = (brand) => {
    setSelectedBrands(prev => {
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand)
      } else {
        return [...prev, brand]
      }
    })
  }

  const handleCheck = (value, id) => {
    const updateChecked = value
      ? [...checked, id]
      : checked.filter((c) => c !== id)
    dispatch(setChecked(updateChecked))
  }

  const handleReset = () => {
    setPriceFilter("")
    setSearchTerm("")
    setSelectedBrands([])
    dispatch(setChecked([]))
    dispatch(setSelectedBrand(null))
    dispatch(setProducts([]))
  }

  const uniqueBrands = [
    ...Array.from(
      new Set(
        filteredProductsQuery.data
          ?.map((product) => product.brand)
          .filter((brand) => brand !== undefined)
      )
    )
  ]

  const handlePriceChange = e => {
    setPriceFilter(e.target.value)
  }

  return (
    <>
      <div className="container mx-auto px-5 text-sm" style={{ maxWidth: "90%" }}>
        <div className="flex md:flex-row">
          <div
            className="bg-neutral-700 p-3 mt-2 mb-4 w-64 flex-shrink-0 top-0"
            style={{
              position: "fixed",
              height: "100vh",
              overflowY: "auto",
              top: "0",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <div className="mb-4">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-300 bg-black px-3 py-2 rounded-full text-center"
              >
                Search by Name
              </label>
              <input
                type="text"
                id="search"
                placeholder="Enter product name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 mt-2 placeholder-gray-600 border border-gray-600 bg-gray-300 text-black rounded-lg focus:outline-none focus:ring focus:border-orange-500"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="priceFilter"
                className="block text-sm font-medium text-gray-300 bg-black px-3 py-2 rounded-full text-center"
              >
                Filter by Price
              </label>
              <input
                type="number"
                id="priceFilter"
                placeholder="Enter price"
                value={priceFilter}
                onChange={handlePriceChange}
                className="w-full px-3 py-2 mt-2 placeholder-gray-600 border border-gray-600 bg-gray-300 text-black rounded-lg focus:outline-none focus:ring focus:border-orange-500"
              />
            </div>

            <div className="mb-4">
              <p className="block text-sm font-medium text-gray-300 bg-black px-3 py-2 rounded-full text-center">
                Filter by Categories
              </p>
              <div className="p-3">
                {categories?.map((c) => (
                  <div key={c._id} className="mb-2 flex items-center">
                    <input
                      type="checkbox"
                      id={`checkbox-${c._id}`}
                      checked={checked.includes(c._id)}
                      onChange={(e) => handleCheck(e.target.checked, c._id)}
                      className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label
                      htmlFor={`checkbox-${c._id}`}
                      className="ml-2 text-sm font-medium text-white"
                    >
                      {c.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="block text-sm font-medium text-gray-300 bg-black px-3 py-2 rounded-full text-center">
                Filter by Brand
              </p>
              <div className="p-3">
                {uniqueBrands?.map((brand) => (
                  <div key={brand} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`brand-${brand}`}
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandCheck(brand)}
                      className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label
                      htmlFor={`brand-${brand}`}
                      className="ml-2 text-sm font-medium text-white"
                    >
                      {brand}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                className="w-full border my-4"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex-1 p-3">
            {products?.length > 0 && (
              <h2 className="h4 text-center mb-2 text-black">{products?.length} Products</h2>
            )}
            {products.length === 0 ? (
              <p className="text-center fontme text-lg text-black top-1">No product found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ml-[20rem]">
                {products
                  ? [...products]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((p) => (
                      <div key={p._id} className="flex justify-center">
                        <div className="w-full" style={{ maxWidth: "320px" }}>
                          <ProductCard p={p} />
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Shop