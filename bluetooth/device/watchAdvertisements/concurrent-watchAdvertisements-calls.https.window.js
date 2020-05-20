// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: script=/bluetooth/resources/bluetooth-test.js
// META: script=/bluetooth/resources/bluetooth-fake-devices.js
'use strict';
const test_desc = 'concurrent watchAdvertisements() calls results in the ' +
    `second call rejecting with 'InvalidStateError'`;

bluetooth_test(async (t) => {
  let {device} = await getDiscoveredHealthThermometerDevice();
  const watcher = new EventWatcher(t, device, ['advertisementreceived']);

  // Start a watchAdvertisements() operation.
  let firstWatchAdvertisementsPromise = device.watchAdvertisements();

  // Start a second watchAdvertisements() operation. This operation should
  // reject with 'InvalidStateError'.
  try {
    await device.watchAdvertisements();
  } catch (e) {
    assert_equals(e.name, 'InvalidStateError');
  }

  // The first watchAdvertisements() operation should resolve successfully.
  try {
    await firstWatchAdvertisementsPromise;
  } catch (e) {
    assert_unreached();
  }

  await fake_central.simulateAdvertisementReceived(
      health_thermometer_ad_packet);
  let evt = await watcher.wait_for('advertisementreceived');
  assert_equals(evt.device, device);
}, test_desc);
