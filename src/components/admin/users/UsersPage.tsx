import { useState, useMemo } from "react";
import SearchBar from "../common/SearchBar";
import SummaryCard from "../common/SummaryCard";
import { useDebounce } from "@/hooks/useDebounce";

type User = {
  username: string;
  fullName: string;
  phone: string;
};

const INITIAL_USERS: User[] = [
  { username: "KK", fullName: "kiki", phone: "9999988888" },
  { username: "Kanishka", fullName: "kanishka sharma", phone: "9876543210" },
];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [selectedUser, setSelectedUser] = useState<User | null>(INITIAL_USERS[0]);

  // debounced value
  const debouncedSearch = useDebounce(search, 400);

  // filtered users
  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) return INITIAL_USERS;

    const q = debouncedSearch.toLowerCase();

    return users.filter((u) =>
  u.username.toLowerCase().includes(q) ||
  u.fullName.toLowerCase().includes(q) ||
  u.phone.includes(q)
  );
  }, [debouncedSearch, users]);
// dlt user
  const handleDeleteUser = () => {
    if (!selectedUser) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedUser.fullName}?`
    );

    if (!confirmed) return;

    setUsers((prev) =>
      prev.filter((u) => u.username !== selectedUser.username)
    );

    setSelectedUser(null);
  };
  return (
    <div className="grid grid-cols-12 gap-6">

      {/* Search */}
      <div className="col-span-12">
        <SearchBar
          placeholder="Search username, phone or name"
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* Summary */}
      <div className="col-span-6">
        <SummaryCard
          title="Total Users"
          value={filteredUsers.length}
          color="red"
        />
      </div>

      <div className="col-span-6">
        <SummaryCard title="Latest Registration" value="—" />
      </div>

      {/* Table */}
      <div className="col-span-8 bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-orange-500 text-white">
            <tr>
              <th className="p-2 text-left">Username</th>
              <th className="p-2 text-left">Full Name</th>
              <th className="p-2 text-left">Phone</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.username}
                onClick={() => setSelectedUser(user)}
                className={`cursor-pointer ${
                  selectedUser?.username === user.username
                    ? "bg-orange-100"
                    : "hover:bg-gray-100"
                }`}
              >
                <td className="p-2">{user.username}</td>
                <td className="p-2">{user.fullName}</td>
                <td className="p-2">{user.phone}</td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Right panel*/}
      <div className="col-span-4 bg-white rounded-xl border p-4">
        {selectedUser ? (
          <>
            <div className="flex justify-between items-center mb-2">
  <h3 className="font-bold">Patient Details</h3>

  <button 
    onClick={handleDeleteUser}
    className="bg-red-500 text-white px-3 py-1 rounded text-sm"
  > 
    Delete User
  </button>
</div>

            <p><b>Username:</b> {selectedUser.username}</p>
            <p><b>Full Name:</b> {selectedUser.fullName}</p>
            <p><b>Phone:</b> {selectedUser.phone}</p>
          </>
        ) : (
          <p className="text-gray-500">Select a user</p>
        )}
      </div>
    </div>
  );
}
