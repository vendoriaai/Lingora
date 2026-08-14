// Tabs — Radix-backed, underline or pill variants. §2 of docs/05.
// Keyboard arrow nav + auto-activate are built into Radix; variant styling is
// propagated to triggers via a small context on the list.
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { createContext, useContext, type ComponentPropsWithoutRef } from 'react';

import { cn } from './cn';

export type TabsVariant = 'underline' | 'pill';

const TabsVariantCtx = createContext<TabsVariant>('underline');

export interface TabsProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: TabsVariant;
  /** Stretch to fill the parent's block width. */
  fullWidth?: boolean;
}

export function Tabs({
  variant = 'underline',
  fullWidth,
  className,
  ...props
}: TabsProps) {
  return (
    <TabsVariantCtx.Provider value={variant}>
      <TabsPrimitive.Root
        className={cn(fullWidth && 'w-full', className)}
        data-variant={variant}
        {...props}
      />
    </TabsVariantCtx.Provider>
  );
}

export type TabsListProps = ComponentPropsWithoutRef<typeof TabsPrimitive.List>;

export function TabsList({ className, ...props }: TabsListProps) {
  const variant = useContext(TabsVariantCtx);
  return (
    <TabsPrimitive.List
      className={cn(
        'flex items-center gap-1',
        variant === 'pill' ? 'rounded-pill bg-bg-2 p-1' : 'w-full gap-0 border-b border-border',
        className,
      )}
      {...props}
    />
  );
}

export type TabsTriggerProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  const variant = useContext(TabsVariantCtx);
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap font-medium text-text-muted transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:pointer-events-none disabled:opacity-50 motion-safe:transition-colors',
        variant === 'pill'
          ? 'rounded-pill px-3 py-1.5 text-sm data-[state=active]:bg-bg data-[state=active]:text-text data-[state=active]:shadow-1'
          : 'h-10 px-4 text-sm data-[state=active]:text-text -mb-px data-[state=active]:border-b-2 data-[state=active]:border-brand-primary',
        className,
      )}
      {...props}
    />
  );
}

export type TabsContentProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

export function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={cn('mt-4 focus:outline-none', className)}
      {...props}
    />
  );
}
