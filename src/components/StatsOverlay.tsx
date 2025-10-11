import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistance, formatDuration } from '@/lib/utils';

interface StatsOverlayProps {
  distance: number;
  duration: number | null;
}

const StatsOverlay: React.FC<StatsOverlayProps> = ({ distance, duration }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Distance
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {formatDistance(distance)}
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Duration
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {formatDuration(duration)}
                </div>
            </CardContent>
        </Card>
    </div>
  );
};

export default StatsOverlay;
