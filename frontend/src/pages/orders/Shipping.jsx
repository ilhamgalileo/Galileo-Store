import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ProgressSteps from "../../components/ProgressSteps";
import { toast } from "react-toastify";
import { savePaymentMethod } from "../../redux/features/cart/cartSlice";
import {
  useSaveAddressMutation,
  useGetProvincesQuery,
  useGetCitiesQuery,
  useGetDistrictsQuery,
  useGetVillagesQuery,
  useGetAddressQuery,
} from "../../redux/api/shippingApiSlice";
import Select from "react-select";
import { setProvince, setCity, setDistrict, setVillage } from "../../redux/features/shipping/shippingSlice";

const Shipping = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const [saveAddress] = useSaveAddressMutation();

  const { data: userData, isLoading: isLoadingAddress } = useGetAddressQuery(userInfo?.user?._id);
  const shippingAddress = userData?.shippingAddress?.[0];

  const { selectedProvince, selectedCity, selectedDistrict, selectedVillage } = useSelector(
    (state) => state.shipping
  );

  const [paymentMethod, setPaymentMethod] = useState(
    userInfo?.user?.isAdmin ? "" : "qris/bank"
  );

  const [qrisBankDetails, setQrisBankDetails] = useState({
    recipient: shippingAddress?.recipient || "",
    postalCode: shippingAddress?.postalCode || "",
    detailAddress: shippingAddress?.detail_address || "",
  });

  const { data: provinces, isLoading: isLoadingProvinces } = useGetProvincesQuery();
  const { data: cities, isLoading: isLoadingCities } = useGetCitiesQuery(selectedProvince?.value || undefined, { skip: !selectedProvince?.value });
  const { data: districts, isLoading: isLoadingDistricts } = useGetDistrictsQuery(selectedCity?.value || undefined, { skip: !selectedCity?.value });
  const { data: villages, isLoading: isLoadingVillages } = useGetVillagesQuery(selectedDistrict?.value || undefined, { skip: !selectedDistrict?.value });

  useEffect(() => {
    if (shippingAddress && !isLoadingAddress) {
      setQrisBankDetails((prev) => ({
        ...prev,
        recipient: prev.recipient || shippingAddress.recipient || "",
        postalCode: prev.postalCode || shippingAddress.postalCode || "",
        detailAddress: prev.detailAddress || shippingAddress.detail_address || "",
      }));
    }
  }, [shippingAddress, isLoadingAddress, dispatch]);

  useEffect(() => {
    if (shippingAddress && provinces?.data) {

      const provinceData = provinces.data.find(
        (province) => province.name === shippingAddress.province
      );

      if (provinceData) {
        dispatch(setProvince({
          value: provinceData.code,
          label: shippingAddress.province,
        }));
      }
    }
  }, [shippingAddress, provinces?.data, dispatch]);

  useEffect(() => {
    if (shippingAddress && cities?.data) {
      const cityData = cities.data.find(
        (city) => city.name === shippingAddress.city
      );

      if (cityData) {
        dispatch(setCity({
          value: cityData.code,
          label: shippingAddress.city,
        }));
      }
    }
  }, [shippingAddress, cities?.data, dispatch]);

  useEffect(() => {
    if (shippingAddress && districts?.data) {
      const districtData = districts.data.find(
        (district) => district.name === shippingAddress.district
      );

      if (districtData) {
        dispatch(setDistrict({
          value: districtData.code,
          label: shippingAddress.district,
        }));
      }
    }
  }, [shippingAddress, districts?.data, dispatch]);

  useEffect(() => {
    if (shippingAddress && villages?.data) {
      const villageData = villages.data.find(
        (village) => village.name === shippingAddress.village
      );

      if (villageData) {
        dispatch(setVillage({
          value: villageData.code,
          label: shippingAddress.village,
        }));
      }
    }
  }, [shippingAddress, villages?.data, dispatch]);

  // const InputField = ({ label, name, value, onChange, placeholder, readOnly = false }) => (
  //   <div className="mb-4">
  //     <label className="block text-gray-950 mb-2">{label}</label>
  //     <input
  //       type="text"
  //       name={name}
  //       value={value}
  //       onChange={onChange}
  //       placeholder={placeholder}
  //       className="w-full p-2 h-[3rem] border rounded shadow-xl text-white bg-neutral-700"
  //       required
  //       readOnly={readOnly}
  //     />
  //   </div>
  // );

  const handleContinue = async () => {
    if (paymentMethod === "qris/bank") {
      const shippingDetails = {
        recipient: qrisBankDetails.recipient,
        province: selectedProvince?.label || "",
        city: selectedCity?.label || "",
        district: selectedDistrict?.label || "",
        village: selectedVillage?.label || "",
        postalCode: qrisBankDetails.postalCode,
        detail_address: qrisBankDetails.detailAddress,
        provinceCode: selectedProvince?.value || "",
        cityCode: selectedCity?.value || "",
        districtCode: selectedDistrict?.value || "",
        villageCode: selectedVillage?.value || "",
      };

      try {
        await saveAddress({
          userId: userInfo.user._id,
          ...shippingDetails,
        }).unwrap();

        dispatch(savePaymentMethod(paymentMethod));
        navigate("/placeorder");
      } catch (error) {
        toast.error("Error saving address:");
      }
    } else if (paymentMethod === "cash") {
      navigate("/placeorder/cash");
    } else if (paymentMethod === "store-transfer") {
      navigate("/placeorder/store-transfer");
    } else {
      toast.error("Please select a payment method.");
    }
  };

  const formatOptions = (data) => {
    return data?.map((item) => ({
      value: item.code,
      label: item.name,
    })) || [];
  };

  const handleQrisBankChange = (e) => {
    setQrisBankDetails((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleProvinceChange = (selectedOption) => {
    dispatch(setProvince(selectedOption));
    setQrisBankDetails((prev) => ({ ...prev, postalCode: "" }));
  };

  const handleCityChange = (selectedOption) => {
    dispatch(setCity(selectedOption));
    setQrisBankDetails((prev) => ({ ...prev, postalCode: "" }));
  };

  const handleDistrictChange = (selectedOption) => {
    dispatch(setDistrict(selectedOption));
    setQrisBankDetails((prev) => ({ ...prev, postalCode: "" }));
  };

  const handleVillageChange = (selectedOption) => {
    dispatch(setVillage(selectedOption));
    const villageData = villages?.data?.find((v) => v.code === selectedOption.value);
    setQrisBankDetails((prev) => ({
      ...prev,
      postalCode: villageData?.postal_code || "",
    }));
  };

  if (isLoadingAddress) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto">
      <ProgressSteps step1 step2 />
      <div className="mt-[2rem] flex justify-around items-center flex-wrap">
        <form className="w-[40rem] text-gray-950">
          <h1 className="text-2xl font-semibold mb-4">Shipping</h1>

          <div className="mb-4">
            <label className="block text-gray-500">Select Payment Method</label>
            {!userInfo.user.isAdmin && (
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-orange-500"
                    name="paymentMethod"
                    value="qris/bank"
                    checked={paymentMethod === "qris/bank"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="ml-2">Qris or Transfer</span>
                </label>
              </div>
            )}
            {userInfo.user.isAdmin && (
              <>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-orange-500"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="ml-2">Cash</span>
                  </label>
                </div>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-orange-500"
                      name="paymentMethod"
                      value="store-transfer"
                      checked={paymentMethod === "store-transfer"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="ml-2">In Store Transfer</span>
                  </label>
                </div>
              </>
            )}
          </div>

          {paymentMethod === "qris/bank" && (
            <>
              <div className="mb-4">
              <label className="block text-gray-950 mb-2">Recipient</label>
                <input
                  label="Recipient Package"
                  name="recipient"
                  className="w-full p-2 h-[3rem] border rounded shadow-xl text-white bg-neutral-700"
                  value={qrisBankDetails.recipient}
                  onChange={handleQrisBankChange}
                  placeholder="Enter package recipient"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="mb-4">
                  <label className="block text-gray-950 mb-2">Province</label>
                  <Select
                    options={formatOptions(provinces?.data)}
                    value={selectedProvince}
                    onChange={handleProvinceChange}
                    isLoading={isLoadingProvinces}
                    isSearchable
                    placeholder="Select Province"
                    className="text-gray-950"
                    menuPlacement="bottom"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-950 mb-2">City</label>
                  <Select
                    options={formatOptions(cities?.data)}
                    value={selectedCity}
                    onChange={handleCityChange}
                    isLoading={isLoadingCities}
                    isSearchable
                    placeholder="Select City"
                    className="text-gray-950"
                    menuPlacement="bottom"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-950 mb-2">District</label>
                  <Select
                    options={formatOptions(districts?.data)}
                    value={selectedDistrict}
                    onChange={handleDistrictChange}
                    isLoading={isLoadingDistricts}
                    isSearchable
                    placeholder="Select District"
                    className="text-gray-950"
                    menuPlacement="bottom"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-950 mb-2">Village</label>
                  <Select
                    options={formatOptions(villages?.data)}
                    value={selectedVillage}
                    onChange={handleVillageChange}
                    isLoading={isLoadingVillages}
                    isSearchable
                    placeholder="Select Village"
                    className="text-gray-950"
                    menuPlacement="bottom"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-950">Postal Code</label>
                  <input
                    label="Postal Code"
                    name="postalCode"
                    className="w-full p-2 h-[3rem] border rounded shadow-xl text-white bg-neutral-700"
                    value={qrisBankDetails.postalCode}
                    placeholder="Postal code will be set automatically"
                    readOnly
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-950">Detail Address</label>
                <textarea
                  name="detailAddress"
                  value={qrisBankDetails.detailAddress}
                  onChange={handleQrisBankChange}
                  placeholder="Enter your detailed address"
                  className="w-full p-2 h-[5rem] border rounded shadow-xl text-white bg-neutral-700"
                  required
                />
              </div>

              <button
                className="bg-orange-600 text-gray-100 py-2 px-4 rounded-lg w-full mt-4"
                type="button"
                onClick={handleContinue}
              >
                Continue
              </button>
            </>
          )}

          {paymentMethod === "cash" && (
            <div className="text-center mt-4">
              <p className="text-gray-500">You will be redirected to the cash order page.</p>
              <button
                className="bg-green-700 text-white py-2 px-4 rounded-lg w-full mt-4"
                type="button"
                onClick={handleContinue}
              >
                Continue
              </button>
            </div>
          )}
          {paymentMethod === "store-transfer" && (
            <div className="text-center mt-4">
              <p className="text-gray-500">You will be redirected to the store transfer page.</p>
              <button
                className="bg-green-700 text-white py-2 px-4 rounded-lg w-full mt-4"
                type="button"
                onClick={handleContinue}
              >
                Continue
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Shipping;