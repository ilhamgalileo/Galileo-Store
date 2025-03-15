import { useEffect, useState } from "react";
import { FaTrash, FaEdit, FaCheck, FaTimes, FaIdBadge } from "react-icons/fa";
import Loader from "../../components/loader";
import { toast } from "react-toastify";
import {
  useDeleteUserMutation,
  useGetUsersQuery,
  useUpdateUserMutation,
  useMarkUserAsAdminMutation,
} from "../../redux/api/usersApiSlice";
import Message from "../../components/Message";
import silverLogo from '../../assets/silvermember.png';
import nonmembericon from '../../assets/nonemember.png';
import goldLogo from '../../assets/goldmember.png';
import platinumLogo from '../../assets/memberplatinum.png';

const UserList = () => {
  const { data: users, refetch, isLoading, error } = useGetUsersQuery();

  const [deleteUser] = useDeleteUserMutation();
  const [makeUserAsAdmin] = useMarkUserAsAdminMutation();

  const [editableUserId, setEditableUserId] = useState(null);
  const [editableUserName, setEditableUserName] = useState("");
  const [editableUserEmail, setEditableUserEmail] = useState("");

  const [updateUser] = useUpdateUserMutation();
  const membership = users?.membership

  useEffect(() => {
    refetch();
  }, [refetch]);

  const getMembershipLogo = (membership) => {
    switch (membership) {
      case "Platinum":
        return platinumLogo;
      case "Gold":
        return goldLogo;
      case "Silver":
        return silverLogo;
      case "None":
        return nonmembericon;
    }
  };

  const deleteHandler = async (id) => {
    if (window.confirm("Are you sure")) {
      try {
        await deleteUser(id);
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const makeAdminHandler = async (id) => {
    if (window.confirm("Are you sure you want to make this user an admin?")) {
      try {
        await makeUserAsAdmin(id);
        toast.success("User has been promoted to admin");
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const toggleEdit = (id, username, email) => {
    setEditableUserId(id);
    setEditableUserName(username);
    setEditableUserEmail(email);
  };

  const updateHandler = async (id) => {
    try {
      await updateUser({
        userId: id,
        username: editableUserName,
        email: editableUserEmail,
      });
      setEditableUserId(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const admins = users ? users.filter((user) => user.isAdmin && user.superAdmin === null) : [];
  const usersList = users ? users.filter((user) => !user.isAdmin && user.superAdmin === null) : [];

  return (
    <div className="p-4 text-gray-950">
      <h1 className="text-2xl font-semibold mb-4 ml-[4rem] mt-8 text-center">Admins</h1>
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <div className="flex flex-col md:flex-row">
          <table className="w-full md:w-4/5 mx-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">NAME</th>
                <th className="px-4 py-2 text-left">EMAIL</th>
                <th className="px-4 py-2 text-left">Delete</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td className="px-4 py-2">{admin._id}</td>
                  <td className="px-4 py-2">
                    {editableUserId === admin._id ? (
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={editableUserName}
                          onChange={(e) => setEditableUserName(e.target.value)}
                          className="w-full p-2 border rounded-lg"
                        />
                        <button
                          onClick={() => updateHandler(admin._id)}
                          className="ml-2 bg-blue-500 text-white py-2 px-4 rounded-lg"
                        >
                          <FaCheck />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {admin.username}{" "}
                        <button
                          onClick={() =>
                            toggleEdit(admin._id, admin.username, admin.email)
                          }
                        >
                          <FaEdit className="ml-[1rem]" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editableUserId === admin._id ? (
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={editableUserEmail}
                          onChange={(e) => setEditableUserEmail(e.target.value)}
                          className="w-full p-2 border rounded-lg"
                        />
                        <button
                          onClick={() => updateHandler(admin._id)}
                          className="ml-2 bg-blue-500 text-white py-2 px-4 rounded-lg"
                        >
                          <FaCheck />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <a href={`mailto:${admin.email}`}>{admin.email}</a>{" "}
                        <button
                          onClick={() =>
                            toggleEdit(admin._id, admin.username, admin.email)
                          }
                        >
                          <FaEdit className="ml-[1rem]" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex">
                      <button
                        onClick={() => deleteHandler(admin._id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-[5rem]">
        <h1 className="text-2xl font-semibold mb-4 ml-[4rem] text-center">Users</h1>
        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">
            {error?.data?.message || error.error}
          </Message>
        ) : (
          <div className="flex flex-col md:flex-row">
            <table className="w-full md:w-4/5 mx-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">NAME</th>
                  <th className="px-4 py-2 text-left">EMAIL</th>
                  <th className="px-4 py-2 text-left">MEMBER</th>
                  <th className="px-4 py-2 text-left">Delete</th>
                  <th className="px-4 py-2 text-left">Make As Admin</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((user) => (
                  <tr key={user._id}>
                    <td className="px-4 py-2">{user._id}</td>
                    <td className="px-4 py-2">
                      {editableUserId === user._id ? (
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={editableUserName}
                            onChange={(e) => setEditableUserName(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                          />
                          <button
                            onClick={() => updateHandler(user._id)}
                            className="ml-2 bg-blue-500 text-white py-2 px-4 rounded-lg"
                          >
                            <FaCheck />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          {user.username}{" "}
                          <button
                            onClick={() =>
                              toggleEdit(user._id, user.username, user.email)
                            }
                          >
                            <FaEdit className="ml-[1rem]" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editableUserId === user._id ? (
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={editableUserEmail}
                            onChange={(e) => setEditableUserEmail(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                          />
                          <button
                            onClick={() => updateHandler(user._id)}
                            className="ml-2 bg-blue-500 text-white py-2 px-4 rounded-lg"
                          >
                            <FaCheck />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <a href={`mailto:${user.email}`}>{user.email}</a>{" "}
                          <button
                            onClick={() =>
                              toggleEdit(user._id, user.name, user.email)
                            }
                          >
                            <FaEdit className="ml-[1rem]" />
                          </button>
                        </div>
                      )}
                    </td>
                    <div className="flex items-center ml-7">
                      <img
                        src={getMembershipLogo(user.membership)}
                        alt={`${membership} Member Logo`}
                        className="w-11 h-11"
                      />
                    </div>
                    <td className="px-4 py-2">
                      {!user.superAdmin && (
                        <div className="flex">
                          <button
                            onClick={() => deleteHandler(user._id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {!user.superAdmin && (
                        <div className="flex">
                          <button
                            onClick={() => makeAdminHandler(user._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                          >
                            <FaIdBadge />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;