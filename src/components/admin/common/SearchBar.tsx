type Props = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ placeholder, value, onChange }: Props) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded-lg px-4 py-2 
                 bg-white text-gray-900 
                 placeholder-gray-400
                 focus:outline-none focus:ring-2 focus:ring-orange-500"
    />
  );
}
