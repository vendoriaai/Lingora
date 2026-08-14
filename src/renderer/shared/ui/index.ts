// shared/ui barrel — single import surface for the design system.
// Per docs/05 §2: every component lives in its own file; this index re-exports
// so consumers do `import { Button, Card } from '@/shared/ui'`.
export { cn } from './cn';
export { Button, type ButtonVariant, type ButtonSize, type ButtonProps } from './Button';
export { IconButton, type IconButtonProps } from './IconButton';
export { Card, type CardVariant, type CardProps } from './Card';
export { Input, type InputProps } from './Input';
export { Textarea, type TextareaProps } from './Textarea';
export { Badge, type BadgeVariant, type BadgeProps } from './Badge';
export { Progress, ProgressRing, type ProgressProps, type ProgressRingProps } from './Progress';
export { Skeleton, type SkeletonProps } from './Skeleton';
export { LoadingSpinner, type LoadingSpinnerProps } from './LoadingSpinner';
export { LoadingScreen, type LoadingScreenProps } from './LoadingScreen';
export { Avatar, type AvatarProps } from './Avatar';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { Alert, type AlertVariant, type AlertProps } from './Alert';
export { ErrorBoundary, type ErrorBoundaryProps } from './ErrorBoundary';
export { Switch, type SwitchSize, type SwitchProps } from './Switch';
export { Tabs, TabsList, TabsTrigger, TabsContent, type TabsVariant, type TabsProps } from './Tabs';
export { Slider, type SliderProps } from './Slider';
export { Tooltip, TooltipProvider, type TooltipProps, type TooltipProviderProps } from './Tooltip';
export { Select, SelectItem, type SelectSize, type SelectProps, type SelectItemProps } from './Select';
export {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  type DropdownMenuProps,
  type DropdownMenuItemProps,
} from './DropdownMenu';
export {
  Dialog,
  DialogClose,
  type DialogSize,
  type DialogSide,
  type DialogProps,
  type DialogCloseProps,
} from './Dialog';
export {
  ToastProvider,
  useToast,
  type ToastVariant,
  type ToastRecord,
} from './Toast';
export { AnimatedRoute, type AnimatedRouteProps } from './AnimatedRoute';
