interface FormErrorProps {
  children: React.ReactNode;
  className?: string;
}

export function FormError({ children, className }: FormErrorProps) {
  return (
    <p className={`text-sm text-destructive mt-1 ${className || ''}`}>
      {children}
    </p>
  );
}
