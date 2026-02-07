'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils';

interface MapPoint {
  id: string;
  type: 'order' | 'nurse' | 'driver';
  label: string;
  address: string;
  lat: number;
  lng: number;
  status?: string;
}

export default function MapPage() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const supabase = getSupabaseBrowserClient();

  const loadMapData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data: orders } = await supabase
      .from('orders')
      .select('*, patient:patients(full_name), service:services(name), nurse:nurses(full_name)')
      .eq('requested_date', today)
      .not('status', 'in', '("completed","cancelled")');

    const mapPoints: MapPoint[] = (orders || [])
      .filter((o: any) => o.lat && o.lng)
      .map((o: any) => ({
        id: o.id,
        type: 'order' as const,
        label: `${o.patient?.full_name} — ${o.service?.name}`,
        address: o.address,
        lat: o.lat,
        lng: o.lng,
        status: o.status,
      }));

    setPoints(mapPoints);
  }, [supabase]);

  useEffect(() => {
    loadMapData();

    // Subscribe to real-time order updates
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => loadMapData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMapData, supabase]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Карта</h1>
        <p className="text-muted-foreground">Заявки на сегодня в реальном времени</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map placeholder (Yandex Maps integration point) */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardContent className="h-full pt-6">
              <div className="h-full rounded-lg bg-muted flex items-center justify-center relative overflow-hidden">
                {/* Map container - connect Yandex Maps API here */}
                <div id="yandex-map" className="absolute inset-0" />
                <div className="text-center text-muted-foreground z-10">
                  <p className="text-lg font-medium">Yandex Maps</p>
                  <p className="text-sm">Добавьте YANDEX_MAPS_API_KEY в .env</p>
                  <p className="text-xs mt-2">Точек на карте: {points.length}</p>
                </div>

                {/* Simple visual representation */}
                <div className="absolute inset-0 p-4">
                  {points.map((point) => (
                    <button
                      key={point.id}
                      className="absolute w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md hover:scale-150 transition-transform"
                      style={{
                        // Map Cherkessk coordinates to relative positions
                        left: `${((point.lng - 42.02) / 0.08) * 80 + 10}%`,
                        top: `${((44.24 - point.lat) / 0.04) * 80 + 10}%`,
                      }}
                      title={point.label}
                      onClick={() => setSelectedPoint(point)}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Точки ({points.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {points.map((point) => (
                <button
                  key={point.id}
                  className="w-full text-left p-2 rounded border hover:bg-muted/50 transition-colors text-sm"
                  onClick={() => setSelectedPoint(point)}
                >
                  <p className="font-medium truncate">{point.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{point.address}</p>
                  {point.status && (
                    <Badge className={`mt-1 ${ORDER_STATUS_COLORS[point.status]}`}>
                      {ORDER_STATUS_LABELS[point.status]}
                    </Badge>
                  )}
                </button>
              ))}
              {points.length === 0 && (
                <p className="text-sm text-muted-foreground">Нет активных точек</p>
              )}
            </CardContent>
          </Card>

          {selectedPoint && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Детали</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{selectedPoint.label}</p>
                <p className="text-muted-foreground">{selectedPoint.address}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}
                </p>
                {selectedPoint.status && (
                  <Badge className={ORDER_STATUS_COLORS[selectedPoint.status]}>
                    {ORDER_STATUS_LABELS[selectedPoint.status]}
                  </Badge>
                )}
                <a
                  href={`/orders/${selectedPoint.id}`}
                  className="block mt-2 text-primary hover:underline text-sm"
                >
                  Открыть заявку &rarr;
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
