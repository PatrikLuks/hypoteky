import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Dashboard from './Dashboard';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('Dashboard', () => {
  it('zobrazí základní statistiky a filtry', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Dashboard
          pripady={[]}
          KROKY={['Krok1','Krok2','Krok3','Krok4']}
          poradci={['Poradce1']}
          aktivniPoradce=""
          setAktivniPoradce={()=>{}}
          stavKrokuFilter=""
          setStavKrokuFilter={()=>{}}
          zobrazArchivovane={false}
          setZobrazArchivovane={()=>{}}
          dashboardPrefs={{showSuccess:true,showPipeline:true}}
          setDashboardPrefs={()=>{}}
          isMobile={false}
          search=""
          setSearch={()=>{}}
          bankaFilter=""
          setBankaFilter={()=>{}}
          terminFilter=""
          setTerminFilter={()=>{}}
        />
      </I18nextProvider>
    );
    expect(screen.getByText(i18n.t('overview'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('pipeline.graph'))).toBeInTheDocument();
  });
});
