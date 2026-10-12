// A right click (Control-click on a Mac) also fires mousedown. Click-to-edit
// previews ignore it, or swapping in the editor takes the image out from under
// the context menu and "Copy image" never appears.
export const isPlainPrimaryPress = (event: {
  button?: number;
  ctrlKey?: boolean;
}): boolean => (event.button ?? 0) === 0 && event.ctrlKey !== true;
