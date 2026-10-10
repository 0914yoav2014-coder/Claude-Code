import { useTranslation } from 'react-i18next';
import { Segmented } from './ui';
import { repo } from '../db/repo';
import { useTrip } from '../state/TripContext';

export function ViewToggle({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const { settings, trip } = useTrip();
  if (trip.travelers.length < 2) return null;
  return (
    <Segmented
      size="sm"
      className={className}
      value={settings.viewMode}
      onChange={(viewMode) => repo.updateSettings({ viewMode })}
      options={[
        { value: 'mine', label: `👤 ${t('view.mine')}` },
        { value: 'group', label: `👥 ${t('view.group')}` },
      ]}
    />
  );
}
