import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground">Конфигурация системы</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Telegram-бот</CardTitle>
            <CardDescription>Настройки интеграции с Telegram-ботом</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Webhook URL</label>
              <p className="font-mono text-xs bg-muted p-2 rounded mt-1">
                {process.env.TELEGRAM_WEBHOOK_URL || 'Не настроен'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Статус</label>
              <p className="mt-1">Настройте TELEGRAM_BOT_TOKEN в .env</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Yandex Maps</CardTitle>
            <CardDescription>Настройки карт и геокодинга</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <div>
              <label className="text-sm font-medium text-muted-foreground">API Key</label>
              <p className="mt-1">
                {process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ? 'Настроен' : 'Не настроен — добавьте YANDEX_MAPS_API_KEY в .env'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Бизнес-настройки</CardTitle>
            <CardDescription>Параметры работы сервиса</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Доплата за срочный вызов</span>
              <span className="font-medium">500 руб.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Доплата за доставку лекарств</span>
              <span className="font-medium">500 руб.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Буфер между заказами</span>
              <span className="font-medium">20 мин.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Политика отмены</span>
              <span className="font-medium">Бесплатно за 3+ ч.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
