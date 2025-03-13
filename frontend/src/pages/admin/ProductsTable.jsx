import React, { useState } from 'react';
import Message from "../../components/Message";
import Loader from "../../components/loader";
import moment from 'moment';
import { useAllProductsQuery } from '../../redux/api/productApiSlice';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ProductsTable = () => {
  const { data: products, isLoading, error } = useAllProductsQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPrice, setSearchPrice] = useState('');
  const [searchStock, setSearchStock] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');

  if (isLoading) return <Loader />;
  if (error) return <Message variant='danger'>{error?.data?.message || error.error}</Message>;

  const filteredProducts = products.filter((product) => {
    const matchesSearchTerm =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product._id.toString().includes(searchTerm)

    const matchSearchPrice =
      product.price.toString().includes(searchPrice);

    const matchSearchStock =
      product.countInStock.toString().includes(searchStock);

    const matchesPriceFilter =
      priceFilter === 'all' ||
      (priceFilter === 'below1m' && product.price < 1000000) ||
      (priceFilter === '1-5' && product.price >= 1000000 && product.price <= 5000000) ||
      (priceFilter === 'above5m' && product.price > 5000000)

    return matchesSearchTerm && matchesPriceFilter && matchSearchPrice && matchSearchStock;
  })
    .sort((a, b) => b.sold - a.sold);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [['ID', 'Nama Produk', 'Harga', 'Stok']],
      body: filteredProducts.map((product) => [
        product._id,
        product.name,
        `Rp ${new Intl.NumberFormat('id-ID').format(product.price)}`,
        product.countInStock,
      ]),
    });
    doc.save(`products-${moment().format('dddd-DD-MM-YYYY')}.pdf`)
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mt-8 flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <input
          type="text"
          placeholder="Search by Name or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 px-3 py-2 text-white bg-gray-600 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        <input
          type="text"
          placeholder="Search Price"
          value={searchPrice}
          onChange={(e) => setSearchPrice(e.target.value)}
          className
          ="w-full md:w-1/3 px-3 py-2 text-white bg-gray-600 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        <input
          type="number"
          placeholder="Search Stock"
          value={searchStock}
          onChange={(e) => setSearchStock(e.target.value)}
          className="w-full md:w-1/3 px-3 py-2 text-white bg-gray-600 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          className="bg-gray-600 w-full md:w-1/4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All Prices</option>
          <option value="below1m">Below RP. 1 Million</option>
          <option value="1-5">RP.1-5M</option>
          <option value="above5m">Above RP. 5 Million</option>
        </select>

        <button
          onClick={exportToPDF}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          Export to PDF
        </button>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-orange-600">
                  <tr className='text-white'>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold">ID</th>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold">Product Name</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold">Price</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold">Stock</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold">Sold</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold">Product enter on</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-gray-700">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr key={product._id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                          {product?._id}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                          {product?.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                          Rp {new Intl.NumberFormat('id-ID').format(product?.price)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                          {product?.countInStock}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                          {product?.sold}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-white">
                          {moment(product?.createdAt).format("dddd, DD-MMMM-YYYY")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-white">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsTable