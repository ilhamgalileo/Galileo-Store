import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import Loader from "../../components/loader"
import { setCredientials } from "../../redux/features/auth/authSlice"
import { toast } from "react-toastify"
import { useRegisterMutation } from "../../redux/api/usersApiSlice"
import { EyeIcon, EyeOffIcon } from "lucide-react"

const Register = () => {
    const [username, setUserName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('')

    const disptach = useDispatch()
    const navigate = useNavigate()

    const [register, { isLoading }] = useRegisterMutation()

    const { userInfo } = useSelector(state => state.auth)

    const { search } = useLocation()
    const sp = new URLSearchParams(search)
    const redirect = sp.get('redirect') || '/'

    useEffect(() => {
        if (userInfo) {
            navigate(redirect)
        }
    }, [navigate, redirect, userInfo])

    const submitHandler = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('password do not match')
        } else {
            try {
                const res = await register({ username, email, password }).unwrap()
                console.log(res)
                disptach(setCredientials({ ...res }))
                navigate(redirect)
                toast.success("User  successfully registered")
            } catch (err) {
                toast.error(err.data.message)
            }
        }
    }

    return (
        <div className="fixed inset-0 overflow-hidden h-screen flex items-center justify-center bg-login-regist">
            <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-center text-white">Register</h1>
                </div>
                <form onSubmit={submitHandler} className="space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            id="name"
                            className="peer w-full rounded border-gray-600 bg-gray-700 text-white p-2 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-orange-600"
                            placeholder="Enter Name"
                            value={username}
                            onChange={(e) => setUserName(e.target.value)}
                        />
                        <label
                            htmlFor="name"
                            className="absolute left-2 top-[-1px] text-xs text-gray-400 transform transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-[-1px] peer-focus:text-xs peer-focus:text-orange-600"
                        >
                            Name
                        </label>
                    </div>

                    <div className="relative">
                        <input
                            type="email"
                            id="email"
                            className="peer w-full rounded border-gray-600 bg-gray-700 text-white p-2 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-orange-600"
                            placeholder="Enter Email"
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

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="confirmPassword"
                            className="peer w-full rounded border-gray-600 bg-gray-700 text-white p-2 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-orange-600"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <label
                            htmlFor="confirmPassword"
                            className="absolute left-2 top-[-1px] text-xs text-gray-400 transform transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-[-1px] peer-focus:text-xs peer-focus:text-orange-600"
                        >
                            Confirm Password
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
                        {isLoading ? "Registering..." : "Register"}
                    </button>

                    {isLoading && <Loader />}
                </form>

                <div className="mt-4 text-center">
                    <p className="text-white">
                        Already have an Account?{" "}
                        <Link
                            to={redirect ? `/login?redirect=${redirect}` : "/login"}
                            className="text-orange-600 hover:underline"
                        >
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Register