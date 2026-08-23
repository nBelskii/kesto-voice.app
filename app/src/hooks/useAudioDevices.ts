import { useCallback, useEffect, useState } from 'react';

export interface AudioDeviceOption {
  deviceId: string;
  label: string;
}

interface AudioDevices {
  inputs: AudioDeviceOption[];
  outputs: AudioDeviceOption[];
  permissionGranted: boolean;
  requestPermission: () => Promise<void>;
}

// Device labels stay blank until the user grants mic access at least once —
// that's a browser privacy rule, not a bug. requestPermission() unlocks them.
export function useAudioDevices(): AudioDevices {
  const [inputs, setInputs] = useState<AudioDeviceOption[]>([]);
  const [outputs, setOutputs] = useState<AudioDeviceOption[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const refresh = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    setInputs(
      devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` })),
    );
    setOutputs(
      devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Speakers ${i + 1}` })),
    );
  }, []);

  const requestPermission = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    setPermissionGranted(true);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
    navigator.mediaDevices.addEventListener('devicechange', refresh);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refresh);
  }, [refresh]);

  return { inputs, outputs, permissionGranted, requestPermission };
}
