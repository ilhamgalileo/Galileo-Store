import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAddAdminMutation } from "../../redux/api/usersApiSlice";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Loader from "../../components/loader";

const AdminRegister = () => {
    const [username, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const [register, { isLoading }] = useAddAdminMutation();

    const submitHandler = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            await register({ username, email, password, isAdmin: true }).unwrap();
            toast.success("Admin successfully added");
            navigate("/super-admin/userlist");
        } catch (err) {
            toast.error(err.data?.message || "Registration failed");
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-login-regist">
            <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8">
                <h1 className="text-2xl font-semibold text-center text-white mb-6">Add Admin Account</h1>
                <form onSubmit={submitHandler} className="space-y-6">
                    <input
                        type="text"
                        className="w-full p-2 bg-gray-700 text-white rounded border-gray-600 focus:ring-orange-600"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUserName(e.target.value)}
                    />
                    <input
                        type="email"
                        className="w-full p-2 bg-gray-700 text-white rounded border-gray-600 focus:ring-orange-600"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full p-2 bg-gray-700 text-white rounded border-gray-600 focus:ring-orange-600"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-2 text-gray-400 hover:text-orange-500"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full p-2 bg-gray-700 text-white rounded border-gray-600 focus:ring-orange-600"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-2 text-gray-400 hover:text-orange-500"
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
                        {isLoading ? "Registering..." : "Add Admin"}
                    </button>
                    {isLoading && <Loader />}
                </form>
            </div>
        </div>
    );
};

export default AdminRegister;