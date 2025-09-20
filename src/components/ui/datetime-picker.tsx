"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateTimePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  timezone?: string
  minDate?: Date
  maxDate?: Date
  showTimezone?: boolean
  required?: boolean
  disabled?: boolean
  className?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  timezone = "UTC",
  minDate,
  maxDate,
  showTimezone = true,
  required = false,
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date>()
  const [time, setTime] = React.useState<string>("12:00")
  const [isOpen, setIsOpen] = React.useState(false)

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      const parsedDate = new Date(value)
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate)
        setTime(format(parsedDate, "HH:mm"))
      }
    }
  }, [value])

  // Update parent when date or time changes
  React.useEffect(() => {
    if (date && time) {
      const [hours, minutes] = time.split(':').map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)
      
      // Format for datetime-local input compatibility
      const formattedValue = format(newDate, "yyyy-MM-dd'T'HH:mm")
      onChange?.(formattedValue)
    }
  }, [date, time, onChange])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
      // If no time is set, default to current time
      if (!time) {
        setTime(format(new Date(), "HH:mm"))
      }
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
  }

  const displayValue = React.useMemo(() => {
    if (date && time) {
      const [hours, minutes] = time.split(':').map(Number)
      const displayDate = new Date(date)
      displayDate.setHours(hours, minutes, 0, 0)
      return format(displayDate, "PPP 'at' HH:mm")
    }
    return placeholder
  }, [date, time, placeholder])

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(date) => {
                if (minDate && date < minDate) return true
                if (maxDate && date > maxDate) return true
                return false
              }}
              initialFocus
            />
            <div className="border-t pt-3">
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                Time
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full"
              />
            </div>
            {showTimezone && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                🌍 Timezone: {timezone}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {required && !date && (
        <p className="text-xs text-red-500">
          Date and time selection is required
        </p>
      )}
    </div>
  )
}
