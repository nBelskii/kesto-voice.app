export type Screen =
  | 'boot'
  | 'login'
  | 'welcome'
  | 'dashboard'
  | 'friends'
  | 'groups'
  | 'messages'
  | 'ringing'
  | 'call'
  | 'screenshare'
  | 'incoming'
  | 'settings'
  | 'about';

export type Theme = 'dark' | 'light' | 'glass';

export interface SteamFriend {
  steamId: string;
  name: string;
  avatarInitials: string;
  online: boolean;
  inGame: boolean;
  gameName?: string;
  hasKesto: boolean;
}
