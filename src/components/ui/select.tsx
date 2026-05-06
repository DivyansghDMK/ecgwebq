import React, { useState } from "react";

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}

export interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface SelectContentProps {
  children: React.ReactNode;
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onClick?: () => void;
}

function Select({ value, onValueChange, children, placeholder }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <SelectTrigger onClick={() => setIsOpen(!isOpen)}>
        {value || placeholder}
        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </SelectTrigger>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          <SelectContent>
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child) && child.type === SelectItem) {
                const itemChild = child as React.ReactElement<SelectItemProps>;
                return React.cloneElement(itemChild, {
                  onClick: () => {
                    onValueChange?.(itemChild.props.value);
                    setIsOpen(false);
                  }
                });
              }
              return child;
            })}
          </SelectContent>
        </div>
      )}
    </div>
  );
}

export function SelectTrigger({ children, className = "", onClick }: SelectTriggerProps) {
  return (
    <div 
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function SelectContent({ children }: SelectContentProps) {
  return <div className="py-1">{children}</div>;
}

export function SelectItem({ value, children, onClick }: SelectItemProps) {
  return (
    <div
      className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-gray-500">{placeholder}</span>;
}

export default Select;
