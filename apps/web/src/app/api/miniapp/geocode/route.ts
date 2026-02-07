import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/telegram/validate';

export async function POST(req: NextRequest) {
  const initData = req.headers.get('x-telegram-init-data');
  if (!initData) {
    return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
  }

  const { valid } = validateInitData(initData);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
  }

  const { lat, lng } = await req.json();
  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  const apiKey = process.env.YANDEX_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Geocoder not configured' }, { status: 500 });
  }

  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${lng},${lat}&format=json&results=1&lang=ru_RU`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 502 });
  }

  const data = await res.json();
  const featureMember = data?.response?.GeoObjectCollection?.featureMember;
  if (!featureMember?.length) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 });
  }

  const address = featureMember[0].GeoObject?.metaDataProperty?.GeocoderMetaData?.text || '';
  return NextResponse.json({ address });
}
