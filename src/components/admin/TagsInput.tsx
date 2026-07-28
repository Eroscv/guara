import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}

const TagsInput = ({ value, onChange, placeholder }: Props) => {
  const [text, setText] = useState("");

  const add = () => {
    const t = text.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText("");
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-10">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-sm px-2 py-1 rounded">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))}>
            <X size={12} />
          </button>
        </span>
      ))}
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        onBlur={add}
        placeholder={placeholder || "Digite e pressione Enter"}
        className="flex-1 min-w-32 border-0 shadow-none focus-visible:ring-0 h-7 p-0"
      />
    </div>
  );
};

export default TagsInput;
