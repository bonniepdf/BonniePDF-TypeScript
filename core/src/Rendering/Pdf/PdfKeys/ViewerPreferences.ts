/** Entries requesting viewer presentation preferences. */
export const ViewerPreferences = {
  /** Whether the viewer should hide its toolbars while displaying the document. */
  HideToolbar: '/HideToolbar',

  /** Whether the viewer should hide its menu bar while displaying the document. */
  HideMenubar: '/HideMenubar',

  /** Whether the viewer should hide window controls such as scroll bars. */
  HideWindowUi: '/HideWindowUI',

  /** Whether the viewer should resize the document window to fit the first displayed page. */
  FitWindow: '/FitWindow',

  /** Whether the viewer should center the document window on the screen. */
  CenterWindow: '/CenterWindow',

  /** Whether the window title should show the document title instead of the filename. */
  DisplayDocumentTitle: '/DisplayDocTitle',
} as const;
