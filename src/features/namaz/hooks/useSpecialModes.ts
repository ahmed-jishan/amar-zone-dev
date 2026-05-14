import { useMemo } from 'react';
import { usePrefsStore } from '../store/prefsStore';

export function useSpecialModes() {
  const ramadanMode = usePrefsStore((state) => state.ramadanMode);
  const travelMode = usePrefsStore((state) => state.travelMode);
  const lifeMode = usePrefsStore((state) => state.lifeMode);

  return useMemo(
    () => ({
      ramadanMode,
      travelMode,
      lifeMode,
      showSuhoorIftar: ramadanMode,
      allowQasrHint: travelMode,
      reminderTone:
        lifeMode === 'busy' ? 'brief' : lifeMode === 'sick' ? 'gentle' : lifeMode === 'focus' ? 'minimal' : 'normal',
      trackingGoal: travelMode || lifeMode === 'sick' ? 'maintain' : 'complete',
    }),
    [lifeMode, ramadanMode, travelMode]
  );
}
