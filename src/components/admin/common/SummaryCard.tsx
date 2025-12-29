type Props = {
  title: string;
  value: string | number;
  color?: "green" | "red";
};

export default function SummaryCard({ title, value, color = "green" }: Props) {
  const bg =
    color === "green"
      ? "bg-green-100 border-green-300"
      : "bg-red-100 border-red-300";

  return (
    <div className={`border ${bg} rounded-xl p-5`}>
      <p className="text-sm text-gray-600">{title}</p>
      <h2 className="text-3xl font-bold text-gray-900 mt-2">
        {value}
      </h2>
    </div>
  );
}
