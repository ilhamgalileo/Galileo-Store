import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useLoginMutation } from "../../redux/api/usersApiSlice";
import { setCredientials } from "../../redux/features/auth/authSlice";
import { toast } from "react-toastify";
import Loader from "../../components/loader";
import logo from '../../assets/galileoBlack.png';
import { EyeIcon, EyeOffIcon } from "lucide-react"; // Gunakan ikon dari lucide-react

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [login, { isLoading }] = useLoginMutation();

    const { userInfo } = useSelector((state) => state.auth);

    const { search } = useLocation();
    const sp = new URLSearchParams(search);
    const redirect = sp.get('redirect') || '/';

    useEffect(() => {
        if (userInfo) {
            navigate(redirect);
        }
    }, [navigate, redirect, userInfo]);

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const res = await login({ email, password }).unwrap();
            dispatch(setCredientials({ ...res }));
            navigate(redirect);
        } catch (err) {
            toast.error(err?.data?.message || err.error);
        }
    };

    return (
        <div className="fixed inset-0 overflow-hidden h-screen flex items-center justify-center bg-login-regist">
            <div className="w-full max-w-2xl bg-gray-800 bg-opacity-90 rounded-lg shadow-xl p-8 flex items-center">
                <div className="w-1/3 flex mr-[2rem]">
                    <img
                        src={logo}
                        alt="Logo"
                        className="w-full object-cover"
                    />
                </div>

                <div className="w-2/3">
                    <h1 className="text-2xl font-semibold text-center text-white mb-6">Sign In</h1>

                    <form onSubmit={submitHandler} className="space-y-6">
                        <div className="relative">
                            <input
                                type="email"
                                id="email"
                                className="peer w-full rounded border-gray-600 bg-gray-700 text-white p-2 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-orange-600"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <label
                                htmlFor="email"
                                className="absolute left-2 top-[-1px] text-xs text-gray-400 transform transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-[-1px] peer-focus:text-xs peer-focus:text-orange-600"
                            >
                                Email
                            </label>
                        </div>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                className="peer w-full rounded border-gray-600 bg-gray-700 text-white p-2 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-orange-600"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <label
                                htmlFor="password"
                                className="absolute left-2 top-[-1px] text-xs text-gray-400 transform transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-[-1px] peer-focus:text-xs peer-focus:text-orange-600"
                            >
                                Password
                            </label>
                            <button
                                type="button"
                                className="absolute right-2 top-3 text-gray-400 hover:text-orange-500"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                            </button>
                        </div>

                        <button
                            disabled={isLoading}
                            type="submit"
                            className="w-full bg-orange-600 text-white p-2 rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>

                        {isLoading && <Loader />}

                        <div className="text-center">
                            <p className="text-white">
                                New Customer?{" "}
                                <Link
                                    to={redirect ? `/register?redirect=${redirect}` : "/register"}
                                    className="text-orange-600 hover:underline"
                                >
                                    Register
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;