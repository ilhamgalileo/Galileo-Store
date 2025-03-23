import { Link, useParams } from "react-router-dom"
import { useGetProductsQuery } from "../redux/api/productApiSlice"
import { useMemo } from "react"
import Loader from "../components/loader"
import Header from "../components/Header"
import Message from "../components/Message"
import Product from "./Products/Product"
import logo from '../assets/galileo2.png'
import ProductCarousel from "./Products/ProductCarousel"
import SmallProduct from "./Products/SmallProduct"

const Home = () => {
  const { keyword } = useParams()
  const { data, isLoading, isError } = useGetProductsQuery({ keyword })
  const shuffledProducts = useMemo(() => {
    if (data?.products) {
      return [...data.products].sort(() => Math.random() - 0.5)
    }
    return []
  }, [data])

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-[5rem] py-4 text-gray-950 top-0 z-50">
        <div className="flex items-center gap-7">
          <Link to="/">
            <img
              src={logo}
              alt="Logo"
              className="w-20 h-25 sm:w-40 sm:h-40 object-contain"
            />
          </Link>
          <div className="absolute left-[53rem] top-[4rem]">
            <ProductCarousel />
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link to="/shop" className="text-sm sm:text-lg font-semibold hover:text-orange-600">
              All Products
            </Link>
            <Link to="/about" className="text-sm sm:text-lg font-semibold hover:text-orange-600">
              About Us
            </Link>
          </nav>
        </div>
      </div>

      <div className="text-center sm:text-left sm:ml-[23rem] mt-2 sm:mt-0">
        <h1 className="text-xl font-semibold text-gray-950">New Releases</h1>
      </div>

      {!keyword ? <Header /> : null}

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <Message variant="danger">
          {isError?.data?.message || isError.error}
        </Message>
      ) : (
        <>
          <div className="flex flex-col items-center sm:flex-row sm:justify-between sticky bg-[#f0f0ef] top-0 z-40 py-4 px-6">
            <h1 className="text-[3rem] ml-[17rem] text-gray-950">Special Products</h1>
            <Link
              to="/shop"
              className="bg-orange-600 font-bold rounded-full py-3 px-10 sm:mt-8 mr-[20rem]"
            >
              Shop
            </Link>
          </div>

          <div className="flex justify-center flex-wrap mt-[5rem] px-6">
            {shuffledProducts.map((product) => (
              <div key={product._id}>
                <Product product={product} />
              </div>
            ))}
          </div>
        </>
      )}
      <footer className="bg-gray-800 text-white py-8 px-6 mt-[2rem] min-h-[4rem]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[4rem]">
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {["Favorite", "Register"].map((item, index) => (
                <li key={index}>
                  <a href={`/${item.toLowerCase().replace(" ", "-")}`} className="hover:text-orange-600">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Schedule</h3>
            {[
              { title: "Address:", content: "Ganeas, Sumedang Utara, Jawa Barat, Indonesia" },
              {
                title: "Shipping:",
                content: "Mon - Sat: Orders before 12 noon (WIB) will be shipped that day\nSun - Holidays: Closed (no shipping)"
              },
              {
                title: "Customer Services:",
                content: "Mon - Fri: 9AM - 4PM WIB\nSat: 8AM - 1PM WIB\nSlow response on holidays and non-working hours."
              }
            ].map((item, index) => (
              <div key={index} className="mt-4">
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm whitespace-pre-line">{item.content}</p>
              </div>
            ))}
          </div>
          <div className="sm:col-span-2 lg:col-span-1 text-sm">
            © 2025, Galileo Store.
          </div>
        </div>
      </footer>
    </>
  )
}

export default Home