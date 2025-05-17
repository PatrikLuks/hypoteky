import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    );
    expect(screen.getByText('Přehled')).toBeInTheDocument();
    expect(screen.getByText('Pipeline (počet případů v jednotlivých fázích)')).toBeInTheDocument();
  });
});
