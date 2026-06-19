'use client'

import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface KpiSparklineProps {
  data: number[]
  positive?: boolean
}

export default function KpiSparkline({ data, positive = true }: KpiSparklineProps) {
  const chartData = data.map((value, i) => ({ i, value }))
  const color = positive ? '#059669' : '#dc2626'

  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
