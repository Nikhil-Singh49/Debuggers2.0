import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Highlight primitive — renders a floating animated background highlight
 * that follows the currently hovered HighlightItem child.
 *
 * Props:
 *  - mode: "parent" — tracks items inside itself
 *  - controlledItems: boolean — items register via context
 *  - hover: boolean — activate on hover
 *  - className: applied to the floating highlight div
 *  - containerClassName: applied to the wrapping container div
 *  - style: extra styles for the floating highlight
 */

const HighlightContext = React.createContext(null);

export function Highlight({
  children,
  className,
  containerClassName,
  style,
  mode = 'parent',
  controlledItems = false,
  hover = false,
}) {
  const containerRef = React.useRef(null);
  const [rect, setRect] = React.useState(null);
  const [visible, setVisible] = React.useState(false);

  const updateHighlight = React.useCallback((element) => {
    if (!containerRef.current || !element) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const itemRect = element.getBoundingClientRect();
    setRect({
      x: itemRect.left - containerRect.left,
      y: itemRect.top - containerRect.top,
      width: itemRect.width,
      height: itemRect.height,
    });
    setVisible(true);
  }, []);

  const hideHighlight = React.useCallback(() => {
    setVisible(false);
  }, []);

  const contextValue = React.useMemo(
    () => ({ updateHighlight, hideHighlight, hover }),
    [updateHighlight, hideHighlight, hover]
  );

  return (
    <HighlightContext.Provider value={contextValue}>
      <div ref={containerRef} className={cn('relative', containerClassName)}>
        <AnimatePresence>
          {visible && rect && (
            <motion.div
              className={cn('absolute pointer-events-none', className)}
              initial={{ opacity: 0, ...rect }}
              animate={{ opacity: 1, ...rect }}
              exit={{ opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 30,
                opacity: { duration: 0.15 },
              }}
              style={{ ...style }}
              layout
            />
          )}
        </AnimatePresence>
        {children}
      </div>
    </HighlightContext.Provider>
  );
}

/**
 * HighlightItem — wraps a child element and registers hover/focus tracking
 * with the nearest Highlight context.
 *
 * asChild: renders the child directly, injecting event handlers.
 */
export function HighlightItem({ children, asChild = false }) {
  const context = React.useContext(HighlightContext);
  const ref = React.useRef(null);

  const handlePointerEnter = React.useCallback(() => {
    if (ref.current && context) {
      context.updateHighlight(ref.current);
    }
  }, [context]);

  const handlePointerLeave = React.useCallback(() => {
    // Don't hide — parent Highlight container handles visibility via its own pointer leave
  }, []);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: (node) => {
        ref.current = node;
        // Forward ref from child
        const childRef = children.ref;
        if (typeof childRef === 'function') childRef(node);
        else if (childRef) childRef.current = node;
      },
      onPointerEnter: (e) => {
        handlePointerEnter();
        children.props.onPointerEnter?.(e);
      },
      onPointerLeave: (e) => {
        handlePointerLeave();
        children.props.onPointerLeave?.(e);
      },
    });
  }

  return (
    <div
      ref={ref}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </div>
  );
}
