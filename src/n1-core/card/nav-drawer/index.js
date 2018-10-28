//import { ACTION_TYPES as PAGE_ACTION_TYPES } from './page.actions';
//import { ACTION_TYPES as USER_MENU_ACTION_TYPES } from './user-menu';
import initReducers from './nav-drawer.reducers';
import { NavDrawerCard } from './nav-drawer.component';
import { ACTION_TYPES } from './nav-drawer.actions';

export * from './nav-drawer.actions';

export function init(register) {
  initReducers(register.reducer);
  register.cardComponent({
    name: 'NavDrawer', 
    component: NavDrawerCard, 
    events: {
      onOpenDrawer: ACTION_TYPES.OPEN_DRAWER,
      onCloseDrawer: ACTION_TYPES.CLOSE_DRAWER,
      onClickNavMenu: ACTION_TYPES.NAV_REQUEST,
    },
  });
}
