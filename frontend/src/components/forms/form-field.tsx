import { Label } from '@/components/ui';
import { FormError } from './form-error';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FormField({
  label,
  children,
  error,
  required,
  className,
}: FormFieldProps) {
  return (
    <div className={className}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && <FormError>{error}</FormError>}
    </div>
  );
}
