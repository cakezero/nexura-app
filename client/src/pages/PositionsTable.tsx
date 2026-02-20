export default function PositionsTable({ positions }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border border-[#393B60] rounded-lg">
        {/* Table Header */}
        <thead className="bg-[#110A2B] text-white">
          <tr>
            <th className="px-4 py-2 text-left">#</th>
            <th className="px-4 py-2 text-left">Account</th>
            <th className="px-4 py-2 text-left">Curve</th>
            <th className="px-4 py-2 text-left">Direction</th>
            <th className="px-4 py-2 text-left">Shares</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="text-white">
          {positions.map((pos, index) => (
            <tr
              key={index}
              className="border-b border-[#393B60] hover:bg-gray-900 transition-colors duration-200"
            >
              <td className="px-4 py-3">{index + 1}</td>

              {/* Account with Avatar */}
              <td className="px-4 py-3 flex items-center gap-2">
                <img
                  src={pos.avatar || "/user.png"}
                  alt="Avatar"
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span>{pos.account}</span>
              </td>

              {/* Curve */}
              <td className="px-4 py-3">
                <span className="bg-gray-700 text-white px-2 py-1 rounded-full text-xs">
                  {pos.curve}
                </span>
              </td>

              {/* Direction */}
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    pos.direction.toLowerCase() === "support"
                      ? "bg-gray-700 text-white"
                      : "bg-[#41289E80] text-white"
                  }`}
                >
                  {pos.direction}
                </span>
              </td>

              <td className="px-4 py-3">{pos.shares}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}