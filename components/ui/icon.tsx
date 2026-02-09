"use client";

import { Icon as IconifyIcon, addIcon } from "@iconify/react";
import type { IconifyIcon as IconifyIconType } from "@iconify/react";

// Import all solar icons used in the app (bundled at build time, no API calls)
import addCircleLinear from "@iconify-icons/solar/add-circle-linear";
import addSquareLinear from "@iconify-icons/solar/add-square-linear";
import altArrowDownLinear from "@iconify-icons/solar/alt-arrow-down-linear";
import altArrowRightBold from "@iconify-icons/solar/alt-arrow-right-bold";
import altArrowRightLinear from "@iconify-icons/solar/alt-arrow-right-linear";
import arrowLeftLinear from "@iconify-icons/solar/arrow-left-linear";
import arrowRightLinear from "@iconify-icons/solar/arrow-right-linear";
import arrowRightUpLinear from "@iconify-icons/solar/arrow-right-up-linear";
import atomBold from "@iconify-icons/solar/atom-bold";
import atomLinear from "@iconify-icons/solar/atom-linear";
import boltBold from "@iconify-icons/solar/bolt-bold";
import book2Linear from "@iconify-icons/solar/book-2-linear";
import bookBookmarkLinear from "@iconify-icons/solar/book-bookmark-linear";
import bookmarkLinear from "@iconify-icons/solar/bookmark-linear";
import bugBold from "@iconify-icons/solar/bug-bold";
import bugLinear from "@iconify-icons/solar/bug-linear";
import buildings2Linear from "@iconify-icons/solar/buildings-2-linear";
import calendarLinear from "@iconify-icons/solar/calendar-linear";
import cameraBold from "@iconify-icons/solar/camera-bold";
import cameraLinear from "@iconify-icons/solar/camera-linear";
import chatLineLinear from "@iconify-icons/solar/chat-line-linear";
import chatRoundDotsBold from "@iconify-icons/solar/chat-round-dots-bold";
import chatRoundDotsLinear from "@iconify-icons/solar/chat-round-dots-linear";
import checkCircleBold from "@iconify-icons/solar/check-circle-bold";
import checkCircleLinear from "@iconify-icons/solar/check-circle-linear";
import checkReadLinear from "@iconify-icons/solar/check-read-linear";
import checkSquareLinear from "@iconify-icons/solar/check-square-linear";
import closeCircleLinear from "@iconify-icons/solar/close-circle-linear";
import closeSquareLinear from "@iconify-icons/solar/close-square-linear";
import cloudBold from "@iconify-icons/solar/cloud-bold";
import codeBold from "@iconify-icons/solar/code-bold";
import codeLinear from "@iconify-icons/solar/code-linear";
import codeSquareBold from "@iconify-icons/solar/code-square-bold";
import codeSquareLinear from "@iconify-icons/solar/code-square-linear";
import commandBold from "@iconify-icons/solar/command-bold";
import copyLinear from "@iconify-icons/solar/copy-linear";
import copyrightLinear from "@iconify-icons/solar/copyright-linear";
import cpuBoltBold from "@iconify-icons/solar/cpu-bolt-bold";
import cpuLinear from "@iconify-icons/solar/cpu-linear";
import crownLinear from "@iconify-icons/solar/crown-linear";
import crownStarBold from "@iconify-icons/solar/crown-star-bold";
import cursorLinear from "@iconify-icons/solar/cursor-linear";
import dangerCircleLinear from "@iconify-icons/solar/danger-circle-linear";
import dangerTriangleBold from "@iconify-icons/solar/danger-triangle-bold";
import dangerTriangleLinear from "@iconify-icons/solar/danger-triangle-linear";
import documentTextBold from "@iconify-icons/solar/document-text-bold";
import documentTextLinear from "@iconify-icons/solar/document-text-linear";
import downloadLinear from "@iconify-icons/solar/download-linear";
import downloadMinimalisticBold from "@iconify-icons/solar/download-minimalistic-bold";
import exitLinear from "@iconify-icons/solar/exit-linear";
import exportLinear from "@iconify-icons/solar/export-linear";
import eyeClosedLinear from "@iconify-icons/solar/eye-closed-linear";
import eyeLinear from "@iconify-icons/solar/eye-linear";
import fileDownloadLinear from "@iconify-icons/solar/file-download-linear";
import fileTextBold from "@iconify-icons/solar/file-text-bold";
import filterLinear from "@iconify-icons/solar/filter-linear";
import folderOpenLinear from "@iconify-icons/solar/folder-open-linear";
import folderWithFilesLinear from "@iconify-icons/solar/folder-with-files-linear";
import galleryAddLinear from "@iconify-icons/solar/gallery-add-linear";
import galleryWideLinear from "@iconify-icons/solar/gallery-wide-linear";
import giftLinear from "@iconify-icons/solar/gift-linear";
import globalBold from "@iconify-icons/solar/global-bold";
import globalLinear from "@iconify-icons/solar/global-linear";
import graphUpLinear from "@iconify-icons/solar/graph-up-linear";
import handMoneyLinear from "@iconify-icons/solar/hand-money-linear";
import hourglassLinear from "@iconify-icons/solar/hourglass-linear";
import inboxLinear from "@iconify-icons/solar/inbox-linear";
import infinityLinear from "@iconify-icons/solar/infinity-linear";
import infoCircleLinear from "@iconify-icons/solar/info-circle-linear";
import keyBold from "@iconify-icons/solar/key-bold";
import letterLinear from "@iconify-icons/solar/letter-linear";
import lightbulbLinear from "@iconify-icons/solar/lightbulb-linear";
import linkLinear from "@iconify-icons/solar/link-linear";
import lockKeyholeBold from "@iconify-icons/solar/lock-keyhole-bold";
import lockKeyholeUnlockedLinear from "@iconify-icons/solar/lock-keyhole-unlocked-linear";
import lockLinear from "@iconify-icons/solar/lock-linear";
import magicStick3Bold from "@iconify-icons/solar/magic-stick-3-bold";
import magicStick3Linear from "@iconify-icons/solar/magic-stick-3-linear";
import magniferLinear from "@iconify-icons/solar/magnifer-linear";
import magniferZoomInLinear from "@iconify-icons/solar/magnifer-zoom-in-linear";
import menuDotsBold from "@iconify-icons/solar/menu-dots-bold";
import menuDotsLinear from "@iconify-icons/solar/menu-dots-linear";
import minusCircleLinear from "@iconify-icons/solar/minus-circle-linear";
import monitorLinear from "@iconify-icons/solar/monitor-linear";
import penLinear from "@iconify-icons/solar/pen-linear";
import penNewSquareLinear from "@iconify-icons/solar/pen-new-square-linear";
import playBold from "@iconify-icons/solar/play-bold";
import playCircleBold from "@iconify-icons/solar/play-circle-bold";
import playLinear from "@iconify-icons/solar/play-linear";
import programmingBold from "@iconify-icons/solar/programming-bold";
import questionCircleBold from "@iconify-icons/solar/question-circle-bold";
import questionCircleLinear from "@iconify-icons/solar/question-circle-linear";
import refreshLinear from "@iconify-icons/solar/refresh-linear";
import rocket2Linear from "@iconify-icons/solar/rocket-2-linear";
import routeLinear from "@iconify-icons/solar/route-linear";
import routing2Linear from "@iconify-icons/solar/routing-2-linear";
import serverBold from "@iconify-icons/solar/server-bold";
import serverSquareBold from "@iconify-icons/solar/server-square-bold";
import serverSquareLinear from "@iconify-icons/solar/server-square-linear";
import settingsBold from "@iconify-icons/solar/settings-bold";
import settingsLinear from "@iconify-icons/solar/settings-linear";
import shareBold from "@iconify-icons/solar/share-bold";
import shieldCheckBold from "@iconify-icons/solar/shield-check-bold";
import shieldCheckLinear from "@iconify-icons/solar/shield-check-linear";
import shieldKeyholeBold from "@iconify-icons/solar/shield-keyhole-bold";
import shieldKeyholeLinear from "@iconify-icons/solar/shield-keyhole-linear";
import sleepingLinear from "@iconify-icons/solar/sleeping-linear";
import smartphoneLinear from "@iconify-icons/solar/smartphone-linear";
import sortVerticalLinear from "@iconify-icons/solar/sort-vertical-linear";
import starsLinear from "@iconify-icons/solar/stars-linear";
import tagPriceLinear from "@iconify-icons/solar/tag-price-linear";
import targetLinear from "@iconify-icons/solar/target-linear";
import testTubeLinear from "@iconify-icons/solar/test-tube-linear";
import ticketLinear from "@iconify-icons/solar/ticket-linear";
import trashBinMinimalisticLinear from "@iconify-icons/solar/trash-bin-minimalistic-linear";
import trashBinTrashLinear from "@iconify-icons/solar/trash-bin-trash-linear";
import userCircleLinear from "@iconify-icons/solar/user-circle-linear";
import userLinear from "@iconify-icons/solar/user-linear";
import usersGroupRoundedBold from "@iconify-icons/solar/users-group-rounded-bold";
import usersGroupRoundedLinear from "@iconify-icons/solar/users-group-rounded-linear";
import usersGroupTwoRoundedBold from "@iconify-icons/solar/users-group-two-rounded-bold";
import videocameraRecordBold from "@iconify-icons/solar/videocamera-record-bold";
import widget5Linear from "@iconify-icons/solar/widget-5-linear";
import widgetBold from "@iconify-icons/solar/widget-bold";
import widgetLinear from "@iconify-icons/solar/widget-linear";
import windowFrameLinear from "@iconify-icons/solar/window-frame-linear";

// Custom icons not in solar set (defined as Iconify-compatible objects)
const githubBoldCustom: IconifyIconType = {
  body: '<path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"/>',
  width: 24,
  height: 24,
};

const robotLinearCustom: IconifyIconType = {
  body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 2v3m0 0a3 3 0 1 0 0 6a3 3 0 0 0 0-6M4 21v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M9 17v4m6-4v4m-3-6h.01"/><circle cx="9" cy="17" r="1" fill="currentColor"/><circle cx="15" cy="17" r="1" fill="currentColor"/>',
  width: 24,
  height: 24,
};

// Register all icons with Iconify (runs once on module load)
const icons: Record<string, IconifyIconType> = {
  "solar:add-circle-linear": addCircleLinear,
  "solar:add-square-linear": addSquareLinear,
  "solar:alt-arrow-down-linear": altArrowDownLinear,
  "solar:alt-arrow-right-bold": altArrowRightBold,
  "solar:alt-arrow-right-linear": altArrowRightLinear,
  "solar:arrow-left-linear": arrowLeftLinear,
  "solar:arrow-right-linear": arrowRightLinear,
  "solar:arrow-right-up-linear": arrowRightUpLinear,
  "solar:atom-bold": atomBold,
  "solar:atom-linear": atomLinear,
  "solar:bolt-bold": boltBold,
  "solar:book-2-linear": book2Linear,
  "solar:book-bookmark-linear": bookBookmarkLinear,
  "solar:bookmark-linear": bookmarkLinear,
  "solar:bug-bold": bugBold,
  "solar:bug-linear": bugLinear,
  "solar:buildings-2-linear": buildings2Linear,
  "solar:calendar-linear": calendarLinear,
  "solar:camera-bold": cameraBold,
  "solar:camera-linear": cameraLinear,
  "solar:chat-line-linear": chatLineLinear,
  "solar:chat-round-dots-bold": chatRoundDotsBold,
  "solar:chat-round-dots-linear": chatRoundDotsLinear,
  "solar:check-circle-bold": checkCircleBold,
  "solar:check-circle-linear": checkCircleLinear,
  "solar:check-linear": checkReadLinear, // Map to check-read-linear
  "solar:check-square-linear": checkSquareLinear,
  "solar:close-circle-linear": closeCircleLinear,
  "solar:close-square-linear": closeSquareLinear,
  "solar:cloud-bold": cloudBold,
  "solar:code-bold": codeBold,
  "solar:code-linear": codeLinear,
  "solar:code-square-bold": codeSquareBold,
  "solar:code-square-linear": codeSquareLinear,
  "solar:copy-linear": copyLinear,
  "solar:copyright-linear": copyrightLinear,
  "solar:cpu-bolt-bold": cpuBoltBold,
  "solar:cpu-linear": cpuLinear,
  "solar:crown-linear": crownLinear,
  "solar:crown-star-bold": crownStarBold,
  "solar:cursor-linear": cursorLinear,
  "solar:danger-circle-linear": dangerCircleLinear,
  "solar:danger-triangle-bold": dangerTriangleBold,
  "solar:danger-triangle-linear": dangerTriangleLinear,
  "solar:document-text-bold": documentTextBold,
  "solar:document-text-linear": documentTextLinear,
  "solar:download-linear": downloadLinear,
  "solar:download-minimalistic-bold": downloadMinimalisticBold,
  "solar:exit-linear": exitLinear,
  "solar:export-linear": exportLinear,
  "solar:eye-closed-linear": eyeClosedLinear,
  "solar:eye-linear": eyeLinear,
  "solar:file-download-linear": fileDownloadLinear,
  "solar:file-text-bold": fileTextBold,
  "solar:filter-linear": filterLinear,
  "solar:folder-open-linear": folderOpenLinear,
  "solar:folder-with-files-linear": folderWithFilesLinear,
  "solar:gallery-add-linear": galleryAddLinear,
  "solar:gallery-wide-linear": galleryWideLinear,
  "solar:gift-linear": giftLinear,
  "solar:github-bold": githubBoldCustom, // Custom GitHub icon
  "solar:global-bold": globalBold,
  "solar:global-linear": globalLinear,
  "solar:graph-up-linear": graphUpLinear,
  "solar:hand-money-linear": handMoneyLinear,
  "solar:hourglass-linear": hourglassLinear,
  "solar:inbox-linear": inboxLinear,
  "solar:infinite-linear": infinityLinear, // Map to infinity-linear
  "solar:info-circle-linear": infoCircleLinear,
  "solar:key-bold": keyBold,
  "solar:letter-linear": letterLinear,
  "solar:lightbulb-linear": lightbulbLinear,
  "solar:link-linear": linkLinear,
  "solar:lock-keyhole-bold": lockKeyholeBold,
  "solar:lock-keyhole-unlocked-linear": lockKeyholeUnlockedLinear,
  "solar:lock-linear": lockLinear,
  "solar:magic-stick-3-bold": magicStick3Bold,
  "solar:magic-stick-3-linear": magicStick3Linear,
  "solar:magnifer-linear": magniferLinear,
  "solar:magnifer-zoom-in-linear": magniferZoomInLinear,
  "solar:menu-dots-bold": menuDotsBold,
  "solar:menu-dots-linear": menuDotsLinear,
  "solar:minus-circle-linear": minusCircleLinear,
  "solar:monitor-linear": monitorLinear,
  "solar:pen-linear": penLinear,
  "solar:pen-new-square-linear": penNewSquareLinear,
  "solar:play-circle-bold": playCircleBold,
  "solar:play-linear": playLinear,
  "solar:programming-bold": programmingBold,
  "solar:question-circle-bold": questionCircleBold,
  "solar:question-circle-linear": questionCircleLinear,
  "solar:refresh-linear": refreshLinear,
  "solar:robot-2-linear": robotLinearCustom, // Custom robot icon
  "solar:rocket-2-linear": rocket2Linear,
  "solar:route-linear": routeLinear,
  "solar:routing-2-linear": routing2Linear,
  "solar:server-bold": serverBold,
  "solar:server-square-bold": serverSquareBold,
  "solar:server-square-linear": serverSquareLinear,
  "solar:settings-bold": settingsBold,
  "solar:settings-linear": settingsLinear,
  "solar:share-bold": shareBold,
  "solar:shield-check-bold": shieldCheckBold,
  "solar:shield-check-linear": shieldCheckLinear,
  "solar:shield-keyhole-bold": shieldKeyholeBold,
  "solar:shield-keyhole-linear": shieldKeyholeLinear,
  "solar:sleeping-linear": sleepingLinear,
  "solar:smartphone-linear": smartphoneLinear,
  "solar:sort-vertical-linear": sortVerticalLinear,
  "solar:stars-linear": starsLinear,
  "solar:tag-price-linear": tagPriceLinear,
  "solar:target-linear": targetLinear,
  "solar:terminal-bold": commandBold, // Map to command-bold
  "solar:test-tube-linear": testTubeLinear,
  "solar:ticket-linear": ticketLinear,
  "solar:trash-bin-minimalistic-linear": trashBinMinimalisticLinear,
  "solar:trash-bin-trash-linear": trashBinTrashLinear,
  "solar:triangle-bold": playBold, // Map to play-bold (triangle shape)
  "solar:triangle-linear": playLinear, // Map to play-linear (triangle shape)
  "solar:user-circle-linear": userCircleLinear,
  "solar:user-linear": userLinear,
  "solar:users-group-rounded-bold": usersGroupRoundedBold,
  "solar:users-group-rounded-linear": usersGroupRoundedLinear,
  "solar:users-group-two-rounded-bold": usersGroupTwoRoundedBold,
  "solar:videocamera-record-bold": videocameraRecordBold,
  "solar:widget-5-linear": widget5Linear,
  "solar:widget-bold": widgetBold,
  "solar:widget-linear": widgetLinear,
  "solar:window-frame-linear": windowFrameLinear,
};

// Register all icons once
for (const [name, data] of Object.entries(icons)) {
  addIcon(name, data);
}

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 24, className }: IconProps) {
  return (
    <IconifyIcon
      icon={name}
      width={size}
      height={size}
      className={className}
    />
  );
}

interface InlineSvgIconProps {
  size?: number;
  className?: string;
}

export function RubberDuckIcon({ size = 24, className }: InlineSvgIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M15.18 2.9a4.9 4.9 0 0 0-2.39.57a5.41 5.41 0 0 0-2.93 4a5.13 5.13 0 0 0 .29 2.82a10 10 0 0 0 .45 1c-.86.06-1.73.11-2.59.19a.4.4 0 0 1-.36-.19a7.8 7.8 0 0 0-4-3.05a.69.69 0 0 0-.92.24a9.6 9.6 0 0 0-1.91 3.2a10 10 0 0 0-.56 3a12.5 12.5 0 0 0 .17 2.66A8.8 8.8 0 0 0 1.3 20a2.8 2.8 0 0 1 .39.6c.34.46.37.39.7.89l.29.32L3 22a16.6 16.6 0 0 0 4.22 1.4a16.3 16.3 0 0 0 3.13.34a14 14 0 0 0 1.6-.06a20 20 0 0 0 2.44-.32a24 24 0 0 0 2.68-.81a2.28 2.28 0 0 0 1.25-.77a10 10 0 0 0 1.9-4.37a9.4 9.4 0 0 0-.22-3.87c-.15-.57-.39-1.1-.59-1.65v-.1a.37.37 0 0 1 .36-.39a6.4 6.4 0 0 0 1.31-.13a3.42 3.42 0 0 0 2.52-2.41A7.8 7.8 0 0 0 23.74 7a.51.51 0 0 0-.43-.59h-3.08c0-.1-.09-.21-.14-.31A5.28 5.28 0 0 0 16 3a4.5 4.5 0 0 0-.82-.1m-.46 1.25a3.5 3.5 0 0 1 .91 0a4 4 0 0 1 2.11.85a4.07 4.07 0 0 1 1.47 2.5a3.82 3.82 0 0 1-.3 2.44a9 9 0 0 1-.77 1.19a.74.74 0 0 0-.09.78c.25.61.51 1.17.7 1.77a7.4 7.4 0 0 1 .25 3.21a7.75 7.75 0 0 1-1 3a6.5 6.5 0 0 1-.77 1.14a2.1 2.1 0 0 1-.72.37a16 16 0 0 1-3.45.89c-.56.06-1.13.1-1.7.12a8 8 0 0 1-1.12 0a18 18 0 0 1-3.37-.44a18.4 18.4 0 0 1-3.35-1.16a2 2 0 0 1-1-1.15c-.29-.66-.52-1.44-.79-2.21a5.3 5.3 0 0 1-.15-1a6.7 6.7 0 0 1-.08-1.25h-.06a17.6 17.6 0 0 1 .44-2.61a7.75 7.75 0 0 1 1.59-3a.24.24 0 0 1 .23 0a6.57 6.57 0 0 1 3.2 2.87a.59.59 0 0 0 .62.35c.83-.06 1.66-.16 2.49-.22c.33 0 .66 0 1 .05h1.13a.59.59 0 0 0 .63-.37a.72.72 0 0 0-.25-.78a3.46 3.46 0 0 1-1.28-1.85a4 4 0 0 1 0-2.66A4.1 4.1 0 0 1 13 4.72a4 4 0 0 1 1.72-.57M16.38 6a1.1 1.1 0 0 0-1.12 1a1.11 1.11 0 1 0 2.21-.08A1.14 1.14 0 0 0 16.38 6m4 1.3h2.22c.39 0 .39 0 .39.4a3.15 3.15 0 0 1-.94 2.12a2.8 2.8 0 0 1-2 .77a5.47 5.47 0 0 0 .34-3.31z"
      />
    </svg>
  );
}
