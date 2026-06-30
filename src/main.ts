/**
 * App entry. Wires the hash router to each screen.
 * lit-html renders into #app on every route change.
 */

import { render } from 'lit-html';

import '@/styles/tokens.css';
import '@/styles/reset.css';
import '@/styles/typography.css';
import '@/styles/global.css';
import '@/styles/components.css';
import '@/styles/screens.css';

import { auth } from '@/lib/auth';
import { currentRoute, go, startRouter, subscribe, type Route, type RouteName } from '@/lib/router';
import { DISCIPLINES, type Discipline } from '@/domain/disciplines';
import { startSyncEngine } from '@/sync/syncEngine';
import { seedMissingQuotes } from '@/quote/seed';

import { Splash } from '@/screens/Splash';
import { PinGate } from '@/screens/PinGate';
import { Setup } from '@/screens/Setup';
import { CoverPhotos } from '@/screens/CoverPhotos';
import { RoomSetup } from '@/screens/RoomSetup';
import { Dashboard } from '@/screens/Dashboard';
import { Room } from '@/screens/Room';
import { Report } from '@/screens/Report';
import { Library } from '@/screens/Library';
import { Migrate } from '@/screens/Migrate';
import { Quotations } from '@/screens/Quotations';
import { ReportDetail } from '@/screens/ReportDetail';

const rootEl = document.getElementById('app');
if (!rootEl) throw new Error('#app missing');
const root: HTMLElement = rootEl;

const PROTECTED: RouteName[] = [
  'setup',
  'cover',
  'room-setup',
  'dashboard',
  'room',
  'report',
  'library',
  'migrate',
  'quotations',
  'report-detail',
];

function dispatch(route: Route) {
  if (PROTECTED.includes(route.name) && !auth.isUnlocked()) {
    go('pin', { to: route.name, ...route.params });
    return;
  }
  switch (route.name) {
    case 'splash':
      render(Splash(), root);
      break;
    case 'pin': {
      const next = (route.params['to'] as RouteName | undefined) ?? 'splash';
      render(PinGate(root, next), root);
      break;
    }
    case 'setup':
      render(Setup(root, route.params['fromQuote']), root);
      break;
    case 'cover':
      render(CoverPhotos(root), root);
      break;
    case 'room-setup':
      render(RoomSetup(root), root);
      break;
    case 'dashboard':
      render(Dashboard(root), root);
      break;
    case 'room': {
      const id = route.params['id'] ?? '';
      const focus = route.params['focus'];
      const discRaw = route.params['disc'];
      const disc: Discipline | undefined =
        discRaw && (DISCIPLINES as readonly string[]).includes(discRaw)
          ? (discRaw as Discipline)
          : undefined;
      const fromRaw = route.params['from'];
      const from: 'report' | 'dashboard' | undefined =
        fromRaw === 'report' || fromRaw === 'dashboard' ? fromRaw : undefined;
      const params: { focus?: string; disc?: Discipline; from?: 'report' | 'dashboard' } = {};
      if (focus) params.focus = focus;
      if (disc) params.disc = disc;
      if (from) params.from = from;
      render(Room(root, id, params), root);
      break;
    }
    case 'report':
      render(Report(root), root);
      break;
    case 'library':
      render(Library(root), root);
      break;
    case 'migrate':
      render(Migrate(root), root);
      break;
    case 'quotations':
      render(Quotations(root), root);
      break;
    case 'report-detail':
      render(ReportDetail(root, route.params['id'] ?? ''), root);
      break;
  }
}

startRouter();
subscribe(dispatch);
dispatch(currentRoute());
startSyncEngine();
void seedMissingQuotes();
