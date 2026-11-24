import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-blue text-white shadow-lg shadow-blue/20 hover:bg-blue-dark hover:-translate-y-0.5',
        outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue hover:-translate-y-0.5',
        ghost: 'text-slate-600 hover:bg-blue-50 hover:text-blue',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        destructive: 'bg-rose-600 text-white hover:bg-rose-500',
        link: 'text-blue underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 py-1.5 text-xs',
        lg: 'h-11 px-6 py-2.5',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
export default Button;
