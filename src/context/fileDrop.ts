import { FileDropEvent, appWindow } from "@tauri-apps/api/window";
import { Event } from "@tauri-apps/api/event";
export default async function setupFileDrop(
  handler: (ev: Event<FileDropEvent>) => void | Promise<void>,
) {
  await appWindow.onFileDropEvent((event) => {
    handler(event);
  });
}
