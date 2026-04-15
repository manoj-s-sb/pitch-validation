// Local API endpoints  →  used with nocLocalApi (http://172.16.10.1:5000)
export const NOC_LOCAL = {
  HEALTH: '/health',
  STATUS: '/status',
  LANE_STATUS: '/status',  // used as /{laneId}/status
};

// Cloud API endpoints  →  used with nocCloudApi (http://stancebema.com)
export const NOC_CLOUD = {
  HEALTH: '/health',
  maintenance: {
    workList: '/admin/work/list',
    createWork: '/admin/work/create',
    updateWork: '/admin/work/update',
    workDetail: '/admin/work/detail',
    uploadUrl: '/admin/work/uploadurl',
    deleteMedia: '/admin/work/deletemedia',
  },
};
