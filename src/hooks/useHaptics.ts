import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Check if we're running in a Capacitor native environment
const isNative = () => {
  return typeof window !== 'undefined' && 
         (window as any).Capacitor?.isNativePlatform?.() === true;
};

export const useHaptics = () => {
  // Light tap - for subtle interactions like toggles, selections
  const lightTap = async () => {
    if (!isNative()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.log('Haptics not available');
    }
  };

  // Medium tap - for button presses, card taps
  const mediumTap = async () => {
    if (!isNative()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.log('Haptics not available');
    }
  };

  // Heavy tap - for important actions like confirming RSVP
  const heavyTap = async () => {
    if (!isNative()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      console.log('Haptics not available');
    }
  };

  // Success notification - for successful actions
  const successNotification = async () => {
    if (!isNative()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      console.log('Haptics not available');
    }
  };

  // Warning notification
  const warningNotification = async () => {
    if (!isNative()) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (e) {
      console.log('Haptics not available');
    }
  };

  // Error notification
  const errorNotification = async () => {
    if (!isNative()) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {
      console.log('Haptics not available');
    }
  };

  // Selection changed - for picker/selector changes
  const selectionChanged = async () => {
    if (!isNative()) return;
    try {
      await Haptics.selectionChanged();
    } catch (e) {
      console.log('Haptics not available');
    }
  };

  // Vibrate - for alerts
  const vibrate = async (duration = 300) => {
    if (!isNative()) return;
    try {
      await Haptics.vibrate({ duration });
    } catch (e) {
      console.log('Haptics not available');
    }
  };

  return {
    lightTap,
    mediumTap,
    heavyTap,
    successNotification,
    warningNotification,
    errorNotification,
    selectionChanged,
    vibrate,
  };
};

export default useHaptics;
