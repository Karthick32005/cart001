let bleDevice;
let bleCharacteristic;
let isBluetoothConnected = false;

const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';         // Nordic UART Service
const CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

const statusDisplay = document.getElementById('status');

async function connectBluetooth() {
  try {
    bleDevice = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID]
    });

    const server = await bleDevice.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    bleCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
    isBluetoothConnected = true;

    bleDevice.addEventListener('gattserverdisconnected', () => {
      isBluetoothConnected = false;
      statusDisplay.textContent = 'Status: Disconnected';
    });

    statusDisplay.textContent = 'Status: Connected';
  } catch (error) {
    alert('Bluetooth connection failed: ' + error);
  }
}

function sendCommand(command) {
  if (isBluetoothConnected && bleCharacteristic) {
    const encoder = new TextEncoder();
    bleCharacteristic.writeValue(encoder.encode(command));
    console.log("Sent:", command);
  }
}

document.getElementById('connectBtn').addEventListener('click', connectBluetooth);

document.getElementById('powerToggle').addEventListener('change', function () {
  sendCommand(this.checked ? 'F' : 'S');
});

document.getElementById('bluetoothToggle').addEventListener('change', function () {
  if (!this.checked && isBluetoothConnected) {
    bleDevice.gatt.disconnect();
  }
});

const joystick = nipplejs.create({
  zone: document.getElementById('joystick-wrapper'),
  mode: 'static',
  position: { left: '50%', top: '50%' },
  color: 'blue',
  size: 150
});

let lastDirection = '';
joystick.on('dir', (evt, data) => {
  if (data.direction && data.direction.angle !== lastDirection) {
    lastDirection = data.direction.angle;
    statusDisplay.innerText = `Direction: ${lastDirection}`;
    const cmd = directionToCommand(lastDirection);
    sendCommand(cmd);
  }
});

joystick.on('end', () => {
  lastDirection = '';
  statusDisplay.innerText = 'Stopped';
  sendCommand('S');
});

function directionToCommand(angle) {
  switch (angle) {
    case 'up': return 'F';
    case 'down': return 'B';
    case 'left': return 'L';
    case 'right': return 'R';
    default: return 'S';
  }
}

