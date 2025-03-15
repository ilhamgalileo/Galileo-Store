import { useState } from "react";
import {
  AiOutlineHome,
  AiOutlineShopping,
  AiOutlineLogin,
  AiOutlineUserAdd,
  AiOutlineShoppingCart,
  AiOutlineDashboard,
  AiOutlineAppstore,
  AiOutlineProfile,
  AiOutlineProduct,
  AiOutlineUser,
} from "react-icons/ai";
import { FaHeart, FaListAlt, FaUserCircle, FaUserTie } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navigation.css";
import { useSelector, useDispatch } from "react-redux";
import { useLogoutMutation } from "../../redux/api/usersApiSlice";
import { logout } from '../../redux/features/auth/authSlice';
import FavoritesCount from "../Products/favoritesCount";

const Navigation = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApiCall] = useLogoutMutation();

  const logoutHandler = async () => {
    try {
      await logoutApiCall().unwrap();
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error(error);
      if (error?.status === 403 || error?.status === 401) {
        dispatch(logout());
        navigate("/login");
      }
    }
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  const getIconColor = (path) => {
    return location.pathname === path ? "orange" : "white";
  };

  return (
    <div
      style={{ zIndex: 99 }}
      className="flex flex-col justify-between p-4 text-white bg w-[10%] hover:w-[15%] h-[100vh] fixed"
      id="navigation-container"
    >
  
      <div className="flex flex-col justify-center space-y-4 ml-2.5">
        <Link to="/" className="flex relative" onClick={closeDropdown}>
          <div className="flex transition-transform transform hover:translate-x-2 duration-300 ease-in-out">
            <AiOutlineHome className="mr-2 mt-[3rem]" size={20} color={getIconColor("/")} />
            <span className="hidden nav-item-name mt-[3rem] text-sm">Home</span>
          </div>
        </Link>

        {!userInfo?.user?.isAdmin && (
          <Link to="/shop" className="flex relative" onClick={closeDropdown}>
            <div className="flex transition-transform transform hover:translate-x-2 duration-300 ease-in-out">
              <AiOutlineShopping className="mr-2 mt-[3rem]" size={20} color={getIconColor("/shop")} />
              <span className="hidden nav-item-name mt-[3rem] text-sm">Shop</span>
            </div>
          </Link>
        )}

        {userInfo?.user?.isAdmin && (
          <Link to="/admin/allproductslist" className="flex relative" onClick={closeDropdown}>
            <div className="flex transition-transform transform hover:translate-x-2 duration-300 ease-in-out">
              <AiOutlineAppstore className="mr-2 mt-[3rem]" size={20} color={getIconColor("/admin/allproductslist")} />
              <span className="hidden nav-item-name mt-[3rem] text-sm">Products</span>
            </div>
          </Link>
        )}

        <Link to="/cart" className="flex relative" onClick={closeDropdown}>
          <div className="flex transition-transform transform hover:translate-x-2 duration-300 ease-in-out">
            <AiOutlineShoppingCart className="mr-2 mt-[3rem]" size={20} color={getIconColor("/cart")} />
            <span className="hidden nav-item-name text-sm mt-[3rem]">Cart</span>
            <div className="absolute left-3 top-10">
              {cartItems.length > 0 && (
                <span className="px-1 py-0 text-xs text-white bg-orange-500 rounded-full w-4 h-4 flex items-center justify-center">
                  {cartItems.reduce((a, c) => a + c.qty, 0)}
                </span>
              )}
            </div>
          </div>
        </Link>

        {!userInfo?.user?.isAdmin && (
          <Link to="/favorite" className="flex relative" onClick={closeDropdown}>
            <div className="flex items-center transition-transform transform hover:translate-x-2 duration-300 ease-in-out">
              <FaHeart className="mt-[3rem] mr-2" size={20} color={getIconColor("/favorite")} />
              <span className="hidden nav-item-name text-sm mt-[3rem]">Favorites</span>
              <FavoritesCount />
            </div>
          </Link>
        )}

        {userInfo?.user?.isAdmin && (
          <>
            <Link to="/admin/dashboard" className="flex relative" onClick={closeDropdown}>
              <div className="flex transition-transform transform hover:translate-x-2 duration-300 ease-in-out">
                <AiOutlineDashboard className="mr-2 mt-[3rem]" size={20} color={getIconColor("/admin/dashboard")} />
                <span className="hidden nav-item-name mt-[3rem] text-sm">Dashboard</span>
              </div>
            </Link>
            <Link to="/admin/category" className="flex relative" onClick={closeDropdown}>
              <div className="flex transition-transform transform hover:translate-x-2 duration-300 ease-in-out">
                <FaListAlt className="mr-2 mt-[3rem]" size={20} color={getIconColor("/admin/category")} />
                <span className="hidden nav-item-name mt-[3rem] text-sm">Category</span>
              </div>
            </Link>
          </>
        )}

        {userInfo?.user?.superAdmin && (
          <>
            <Link to="/super-admin/order-record" className="flex relative" onClick={closeDropdown}>
              <div className="flex transition-transform transform hover:translate-x-2 duration-300 ease-in-out">
                <AiOutlineProfile className="mr-2 mt-[3rem]" size={20} color={getIconColor("/super-admin/order-record")} />
                <span className="hidden nav-item-name mt-[3rem] text-sm">
                  Order Records
                </span>
              </div>
            </Link>
            <Link to="/super-admin/product-record" className="flex relative" onClick={closeDropdown}>
              <div className="flex transition-transform transform hover:translate-x-2 duration-300 ease-in-out">
                <AiOutlineProduct className="mr-2 mt-[3rem]" size={20} color={getIconColor("/super-admin/product-record")} />
                <span className="hidden nav-item-name mt-[3rem] text-sm">
                  Product Records
                </span>
              </div>
            </Link>
            <Link to="/super-admin/userlist" className="flex relative" onClick={closeDropdown}>
              <div className="flex transition-transform transform hover:translate-x-2 duration-300 ease-in-out">
                <AiOutlineUser className="mr-2 mt-[3rem]" size={20} color={getIconColor("/super-admin/userlist")} />
                <span className="hidden nav-item-name mt-[3rem] text-sm">
                  User Management
                </span>
              </div>
            </Link>
            <Link to="/super-admin/admin-register" className="flex relative" onClick={closeDropdown}>
              <div className="flex transition-transform transform hover:translate-x-2 duration-300 ease-in-out">
                <FaUserTie className="mr-2 mt-[2rem]" size={20} color={getIconColor("/super-admin/admin-register")} />
                <span className="hidden nav-item-name mt-[2rem] text-sm">
                  Add Admin Account
                </span>
              </div>
            </Link>
          </>
        )}
      </div>

      <div className="relative">
        {userInfo ? (
          <div className="relative inline-block text-left">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center p-2 rounded-lg hover:bg-gray-700/50 transition-colors duration-200 min-w-[2.5rem]"
            >
              <FaUserCircle className="text-white" size={24} />
              <span className="hidden nav-item-name text-sm ml-2 truncate max-w-[100px]">
                {userInfo.user.username}
              </span>
            </button>

            {dropdownOpen && (
              <div
                className="absolute left-0 bottom-full mb-2 w-48 bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                role="menu"
              >
                <div className="py-1" role="none">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-white hover:bg-gray-700 rounded-t-lg"
                    onClick={closeDropdown}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={logoutHandler}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 rounded-b-lg"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            <li>
              <Link to="/login" className="flex relative" onClick={closeDropdown}>
                <div className="flex items-center mt-5 transition-transform transform hover:translate-x-2 duration-300 ease-in-out">
                  <AiOutlineLogin className="mr-2" size={26} color={getIconColor("/login")} />
                  <span className="hidden nav-item-name text-sm">Login</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/register" className="flex relative" onClick={closeDropdown}>
                <div className="flex items-center mt-5 transition-transform transform hover:translate-x-2 duration-300 ease-in-out">
                  <AiOutlineUserAdd className="mr-2" size={26} color={getIconColor("/register")} />
                  <span className="hidden nav-item-name text-sm">Reg</span>
                </div>
              </Link>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Navigation;