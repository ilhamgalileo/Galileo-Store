import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Loader from "../../components/loader";
import { setCredientials } from "../../redux/features/auth/authSlice";
import { Link } from "react-router-dom";
import { useProfileMutation, useGetUserProfileQuery } from "../../redux/api/usersApiSlice";
import MembershipProgress from "../../components/memberProgress";
import silverLogo from '../../assets/silvermember.png';
import goldLogo from '../../assets/goldmember.png';
import platinumLogo from '../../assets/memberplatinum.png';

const Profile = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const { userInfo } = useSelector((state) => state.auth);

    const [updateProfile, { isLoading: loadingUpdateProfile }] = useProfileMutation();
    const { data: userProfile } = useGetUserProfileQuery();
    const [phone, setPhone] = useState('');
    const membership = userProfile?.membership;
    const point = userProfile?.point || 0;

    useEffect(() => {
        if (userInfo) {
            setUsername(userInfo.user.username);
            setEmail(userInfo.user.email);
        }
    }, [userInfo]);

    useEffect(() => {
        if (userProfile) {
            setPhone(userProfile?.phone)
        }
    }, [userProfile])

    const dispatch = useDispatch();
    const submitHandler = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Password does not match");
            return;
        }

        try {
            const res = await updateProfile({
                _id: userInfo._id,
                username,
                email,
                phone,
                password,
            }).unwrap();
            dispatch(setCredientials({ ...res }));
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error(error?.data?.message || error.message);
        }
    };

    const getMembershipBenefits = (membership) => {
        switch (membership) {
            case "Platinum":
                return "7% off + free shipping";
            case "Gold":
                return "5% off";
            case "Silver":
                return "3% off";
        }
    };

    const getMembershipLogo = (membership) => {
        switch (membership) {
            case "Platinum":
                return platinumLogo;
            case "Gold":
                return goldLogo;
            case "Silver":
                return silverLogo;
        }
    };

    const getMembershipTextColor = (membership) => {
        switch (membership) {
            case "Platinum":
                return "text-purple-600";
            case "Gold":
                return "text-yellow-500";
            case "Silver":
                return "text-gray-500";
        }
    };

    return (
        <div className="container mx-auto p-7 max-w-lg">
            <div className="mb-[2rem] h-[9rem]">
                {!userInfo.isAdmin && (
                    <>
                        <MembershipProgress point={point} membership={membership} />

                        {membership === 'None' ? (
                            <div className="flex items-center mt-5 justify-center gap-1">
                                <h2 className="text-2xl font-semibold text-gray-950 text-center">
                                    You are now a regular account, earn and spend to receive interesting promotions.
                                </h2>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="flex items-center mt-5 justify-center gap-1">
                                    <img
                                        src={getMembershipLogo(membership)}
                                        alt={`${membership} Member Logo`}
                                        className="w-11 h-11"
                                    />
                                    <h3 className={`text-xl font-semibold ${getMembershipTextColor(membership)}`}>
                                        Membership: {membership}
                                    </h3>
                                </div>
                                <p className="text-gray-600">Benefit: {getMembershipBenefits(membership)}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
            <form onSubmit={submitHandler} className="space-y-4 bg-white p-5 rounded-lg shadow-lg">
                <div>
                    <label className="block text-gray-700 font-semibold mb-1">Name</label>
                    <input
                        type="text"
                        placeholder="Enter Name"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-700 font-semibold mb-1">Email</label>
                    <input
                        type="email"
                        placeholder="Enter email"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-700 font-semibold mb-1">Phone</label>
                    <input
                        type="number"
                        placeholder="Enter phone Number"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-700 font-semibold mb-1">Password</label>
                    <input
                        type="password"
                        placeholder="Enter password"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-gray-700 font-semibold mb-1">Confirm Password</label>
                    <input
                        type="password"
                        placeholder="Confirm password"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
                <div className="flex justify-between">
                    <button
                        type="submit"
                        className="w-full bg-orange-600 text-white py-3 rounded-md hover:bg-orange-700 transition duration-200"
                        disabled={loadingUpdateProfile}
                    >
                        {loadingUpdateProfile ? "Updating..." : "Update"}
                    </button>
                </div>
            </form>
            <div className="text-center mt-4">
                {!userInfo.isAdmin && (
                    <Link to="/user-orders" className="text-orange-600 font-semibold hover:underline">
                        View My Orders
                    </Link>
                )}
            </div>
            {loadingUpdateProfile && <Loader />}
        </div>
    );
};

export default Profile;