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

import { Splash } from '@/screens/Splash';
import { PinGate } from '@/screens/PinGate';
import { Setup } from '@/screens/Setup';
import { CoverPhotos } from '@/screens/CoverPhotos';
import { RoomSetup } from '@/screens/RoomSetup';
import { Dashboard } from '@/screens/Dashboard';
import { Room } from '@/screens/Room';
import { Report } from '@/screens/Report';
import { Library } from '@/screens/Library';
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
      render(Setup(root), root);
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
    case 'room':
      render(Room(root, route.params['id'] ?? ''), root);
      break;
    case 'report':
      render(Report(root), root);
      break;
    case 'library':
      render(Library(root), root);
      break;
    case 'report-detail':
      render(ReportDetail(root, route.params['id'] ?? ''), root);
      break;
  }
}

startRouter();
subscribe(dispatch);
dispatch(currentRoute());
