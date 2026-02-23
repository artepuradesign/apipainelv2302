import React from 'react';

interface ModuleGridWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const ModuleGridWrapper = ({ children, className = '' }: ModuleGridWrapperProps) => {
  return (
    <div 
      className={[
        "grid w-full mx-auto justify-items-center",
        "px-2",
        "gap-1.5",
        "[grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]",
        "justify-center",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
};

export default ModuleGridWrapper;