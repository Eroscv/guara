const HighlightTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`font-heading font-extrabold uppercase text-2xl md:text-3xl leading-tight text-primary ${className}`}>
    {children}
  </h3>
);

export default HighlightTitle;
