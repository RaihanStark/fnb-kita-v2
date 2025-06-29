import * as React from "react"
import { cn } from "@/lib/utils"

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  value?: number | string
  onChange?: (value: number | undefined) => void
  allowDecimals?: boolean
  min?: number
  max?: number
  step?: number
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, allowDecimals = true, min, max, step = 0.01, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState<string>(() => {
      if (value === undefined || value === null || value === '') return ''
      return String(value)
    })

    React.useEffect(() => {
      if (value === undefined || value === null || value === '') {
        setInputValue('')
      } else {
        setInputValue(String(value))
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value

      // Allow empty string
      if (newValue === '') {
        setInputValue('')
        onChange?.(undefined)
        return
      }

      // Allow negative sign at the beginning
      if (newValue === '-' && (!min || min < 0)) {
        setInputValue(newValue)
        return
      }

      // Regex for validating number input
      const regex = allowDecimals
        ? /^-?\d*\.?\d*$/  // Allow decimals
        : /^-?\d*$/         // Only integers

      if (regex.test(newValue)) {
        setInputValue(newValue)
        
        // Only call onChange with parsed number if it's a valid number
        const parsedValue = parseFloat(newValue)
        if (!isNaN(parsedValue)) {
          // Check min/max constraints
          if (min !== undefined && parsedValue < min) return
          if (max !== undefined && parsedValue > max) return
          
          onChange?.(parsedValue)
        }
      }
    }

    const handleBlur = () => {
      // Clean up the input on blur
      if (inputValue === '' || inputValue === '-' || inputValue === '.') {
        setInputValue('')
        onChange?.(undefined)
        return
      }

      const parsedValue = parseFloat(inputValue)
      if (!isNaN(parsedValue)) {
        // Apply min/max constraints
        let finalValue = parsedValue
        if (min !== undefined && finalValue < min) finalValue = min
        if (max !== undefined && finalValue > max) finalValue = max
        
        // Format the number to remove trailing zeros
        const formatted = finalValue.toString()
        setInputValue(formatted)
        onChange?.(finalValue)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter
      if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
        return
      }

      // Handle arrow up/down for incrementing/decrementing
      if (e.keyCode === 38 || e.keyCode === 40) {
        e.preventDefault()
        const currentValue = parseFloat(inputValue) || 0
        const stepValue = step || 1
        const newValue = e.keyCode === 38 ? currentValue + stepValue : currentValue - stepValue
        
        if (min !== undefined && newValue < min) return
        if (max !== undefined && newValue > max) return
        
        const formatted = newValue.toString()
        setInputValue(formatted)
        onChange?.(newValue)
      }
    }

    return (
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }