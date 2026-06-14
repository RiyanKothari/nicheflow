import { createContext, useContext, useState, useMemo } from "react";

export type DateFilterType = "today" | "week" | "month" | "custom";

function startOf(date: Date, unit: "day" | "week" | "month"): Date {
  const d = new Date(date);
  if (unit === "day") { d.setHours(0,0,0,0); return d; }
  if (unit === "week") { const day = d.getDay(); d.setDate(d.getDate() - day); d.setHours(0,0,0,0); return d; }
  if (unit === "month") { d.setDate(1); d.setHours(0,0,0,0); return d; }
  return d;
}

function endOf(date: Date, unit: "day" | "week" | "month"): Date {
  const d = new Date(date);
  if (unit === "day") { d.setHours(23,59,59,999); return d; }
  if (unit === "week") { const day = d.getDay(); d.setDate(d.getDate() + (6 - day)); d.setHours(23,59,59,999); return d; }
  if (unit === "month") { d.setMonth(d.getMonth() + 1, 0); d.setHours(23,59,59,999); return d; }
  return d;
}

interface DateFilterContextType {
  filter: DateFilterType;
  startDate: Date;
  endDate: Date;
  setFilter: (f: DateFilterType) => void;
  setCustomRange: (start: Date, end: Date) => void;
}

const DateFilterContext = createContext<DateFilterContextType>({
  filter: "month",
  startDate: startOf(new Date(), "month"),
  endDate: endOf(new Date(), "month"),
  setFilter: () => {},
  setCustomRange: () => {},
});

export function useDateFilter() { return useContext(DateFilterContext); }

export function DateFilterProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilterState] = useState<DateFilterType>("month");
  const [customStart, setCustomStart] = useState<Date>(startOf(new Date(), "month"));
  const [customEnd, setCustomEnd]     = useState<Date>(endOf(new Date(), "month"));

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (filter === "today")  return { startDate: startOf(now, "day"),   endDate: endOf(now, "day")   };
    if (filter === "week")   return { startDate: startOf(now, "week"),  endDate: endOf(now, "week")  };
    if (filter === "month")  return { startDate: startOf(now, "month"), endDate: endOf(now, "month") };
    return { startDate: customStart, endDate: customEnd };
  }, [filter, customStart, customEnd]);

  const setFilter = (f: DateFilterType) => setFilterState(f);
  const setCustomRange = (s: Date, e: Date) => { setCustomStart(s); setCustomEnd(e); setFilterState("custom"); };

  return (
    <DateFilterContext.Provider value={{ filter, startDate, endDate, setFilter, setCustomRange }}>
      {children}
    </DateFilterContext.Provider>
  );
}
