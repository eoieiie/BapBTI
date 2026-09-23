import { LegalPage } from '../components/LegalPage';
import { isKo, t } from '../lib/i18n';
import { PRIVACY_EN, PRIVACY_KO } from '../lib/legal';

export default function Privacy() {
  return <LegalPage title={t('settings.privacy')} body={isKo() ? PRIVACY_KO : PRIVACY_EN} />;
}
