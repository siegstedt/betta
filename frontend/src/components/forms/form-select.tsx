import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from './form-field';

interface FormSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FormSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  error,
  required,
  className,
}: FormSelectProps) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      className={className}
    >
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
