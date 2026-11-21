// componentGuard.test.ts: the files that still take an older shared part (docs/decisions/temel.md,
// 21 Kasım). A ratchet: a new file fails, and a listed file that no longer takes it must leave the
// list, so it only shrinks.

// The older Text (components/Text): new code takes the kit's T (src/aura/kit.tsx).
export const OLD_TEXT_ALLOWED: readonly string[] = [
  'src/components/Banner.tsx',
  'src/components/ChatBubble.tsx',
  'src/components/ChoiceChip.tsx',
  'src/components/Composer.tsx',
  'src/components/ConnectionBanner.tsx',
  'src/components/ProfilePhoto.tsx',
  'src/components/ScreenHeader.tsx',
  'src/features/design/PreviewBlock.tsx',
  'src/features/design/capsuleGridCanvas.tsx',
  'src/features/design/capsuleMeasurePreview.tsx',
  'src/features/design/gorsel/GateState.tsx',
  'src/features/design/measurePreview.tsx',
  'src/features/design/motionPreview.tsx',
  'src/features/design/previews.tsx',
  'src/features/design/scrollPreview.tsx',
  'src/features/design/workshop/WorkshopSet.tsx',
  'src/features/games/FirstGameIntro.tsx',
  'src/features/games/GameBits.tsx',
  'src/features/games/TimeUpOverlay.tsx',
  'src/features/games/TurnReady.tsx',
  'src/features/games/ibre/Ibre.tsx',
  'src/features/games/sahtekar/Sahtekar.tsx',
  'src/features/games/sahtekar/Seat.tsx',
  'src/features/games/say/Say.tsx',
  'src/motion/Menu.tsx',
  'src/motion/TopBar.tsx',
];

// The older Avatar (components/Avatar): new code takes the kit's Av; both draw one look (21 Kasım).
export const OLD_AVATAR_ALLOWED: readonly string[] = [
  'app/(app)/district/room.tsx',
  'app/(app)/venue-chat/index.tsx',
  'src/components/CapsuleAvatar.tsx',
  'src/components/ChatBubble.tsx',
  'src/features/chat/ChatPanel.tsx',
  'src/features/checkin/IdentitySheet.tsx',
  'src/features/design/measurePreview.tsx',
  'src/features/design/partsPreview.tsx',
  'src/features/design/previews.tsx',
  'src/features/district/People.tsx',
  'src/features/friends/MasaRequests.tsx',
  'src/features/friends/RequestList.tsx',
  'src/features/games/TurnReady.tsx',
  'src/features/rooms/IncomingRequest.tsx',
  'src/features/rooms/RoomPeople.tsx',
];

// A bare TextInput: a field is components/Field.tsx (Field, SearchField, BareField). The chat's
// writing field, the code's boxes, the sign-up's and the games' own fields draw their own boards.
export const RAW_INPUT_ALLOWED: readonly string[] = [
  'src/components/CodeInput.tsx',
  'src/components/Composer.tsx',
  'src/features/games/kaupholl/KauphollGame.tsx',
  'src/features/games/kibrit/KibritGame.tsx',
  'src/features/games/sahtekar/KrotGame.tsx',
  'src/features/games/signum/SignumParts.tsx',
  'src/features/onboarding/SignupField.tsx',
];
