// Mock data — replace with real API calls later

function devices(overrides = {}) {
  const defaults = {
    'Bowling Machine': 'online',
    'CV Left Cam': 'online',
    'CV Right Cam': 'online',
    'Display': 'online',
    'Tablets': 'online',
  };
  const merged = { ...defaults, ...overrides };
  const iconMap = {
    'Bowling Machine': 'zap',
    'CV Left Cam': 'camera',
    'CV Right Cam': 'camera',
    'Display': 'monitor',
    'Tablets': 'tablet',
  };
  return Object.entries(merged).map(([name, status]) => ({
    name,
    icon: iconMap[name],
    status,
  }));
}

export const facilities = [
  {
    id: 'us',
    name: 'US Facility',
    flag: 'us',
    lanes: [
      { id: 1, name: 'Lane 1', type: 'Batting', devices: devices({ 'CV Right Cam': 'offline' }) },
      { id: 2, name: 'Lane 2', type: 'Batting', devices: devices() },
      { id: 3, name: 'Lane 3', type: 'Batting', devices: devices({ Tablets: 'warning' }) },
      { id: 4, name: 'Lane 4', type: 'Batting', devices: devices() },
      { id: 5, name: 'Lane 5', type: 'Batting', devices: devices({ 'Bowling Machine': 'offline' }) },
      { id: 6, name: 'Lane 6', type: 'Hybrid', devices: devices() },
      { id: 7, name: 'Lane 7', type: 'Hybrid', devices: devices({ Display: 'offline' }) },
    ],
  },
  {
    id: 'india',
    name: 'India Facility',
    flag: 'in',
    lanes: [
      { id: 1, name: 'Lane 1', type: 'Batting', devices: devices() },
      { id: 2, name: 'Lane 2', type: 'Batting', devices: devices({ Tablets: 'warning' }) },
      { id: 3, name: 'Lane 3', type: 'Batting', devices: devices({ 'CV Right Cam': 'offline' }) },
      { id: 4, name: 'Lane 4', type: 'Batting', devices: devices() },
      { id: 5, name: 'Lane 5', type: 'Hybrid', devices: devices() },
      { id: 6, name: 'Lane 6', type: 'Hybrid', devices: devices() },
      { id: 7, name: 'Lane 7', type: 'Batting', devices: devices() },
    ],
  },
];
