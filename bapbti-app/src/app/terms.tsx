import { LegalPage } from '../components/LegalPage';
import { isKo, t } from '../lib/i18n';
import { TERMS_EN, TERMS_KO } from '../lib/legal';

export default function Terms() {
  return <LegalPage title={t('settings.terms')} body={isKo() ? TERMS_KO : TERMS_EN} />;
}
