import { createAsyncThunk } from '@reduxjs/toolkit';

import { NOC_CLOUD } from '../../constants/endpoints';
import { nocCloudApi } from '../../services';
import { handleApiError } from '../../../utils/errorUtils';

import { CreateWorkRequest, UpdateWorkRequest, WorkListRequest } from './types';

// POST /admin/work/uploadurl
// Request:  { facilityCode, fileName }
// Response: { data: { uploadUrl, blobName } }
export const getWorkUploadUrl = async (
  facilityCode: string,
  fileName: string,
): Promise<{ uploadUrl: string; blobName: string }> => {
  const response = await nocCloudApi.post(NOC_CLOUD.maintenance.uploadUrl, { facilityCode, fileName });
  const data = response?.data?.data;
  return { uploadUrl: data?.uploadUrl as string, blobName: data?.blobName as string };
};

// POST /admin/work/deletemedia
// Request:  { blobName }
// Response: void
export const deleteWorkMedia = async (blobName: string): Promise<void> => {
  await nocCloudApi.post(NOC_CLOUD.maintenance.deleteMedia, { blobName });
};

// PUT <uploadUrl>  (Azure Blob Storage — direct upload, not through our API)
// Request:  raw File binary
// Response: void
export const uploadFileToBlob = async (uploadUrl: string, file: File): Promise<void> => {
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'x-ms-blob-type': 'BlockBlob' },
    body: file,
  });
};

// POST /admin/work/list
// Request:  WorkListRequest  { facilityCode, page, limit, type?, status?, ... }
// Response: { data: { items, total, page, limit, totalPages } }
export const getWorkList = createAsyncThunk(
  'maintenance/getWorkList',
  async (payload: WorkListRequest, { rejectWithValue }) => {
    try {
      const body: Record<string, any> = {
        facilityCode: payload.facilityCode,
        page: payload.page,
        limit: payload.limit,
      };

      if (payload.type) body.type = payload.type;
      if (payload.status) body.status = payload.status;
      if (payload.category) body.category = payload.category;
      if (payload.frequency) body.frequency = payload.frequency;
      if (payload.scheduledDate) body.scheduledDate = payload.scheduledDate;
      if (payload.fromDate) body.fromDate = payload.fromDate;
      if (payload.toDate) body.toDate = payload.toDate;
      if (payload.laneNo !== undefined) body.laneNo = payload.laneNo;
      if (payload.isActive !== undefined) body.isActive = payload.isActive;

      const response = await nocCloudApi.post(NOC_CLOUD.maintenance.workList, body);
      return response?.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch work list'));
    }
  },
);

// POST /admin/work/update
// Request:  UpdateWorkRequest  { itemId, status?, scheduledDate?, ... }
// Response: { data: Work }
export const updateWork = createAsyncThunk(
  'maintenance/updateWork',
  async (payload: UpdateWorkRequest, { rejectWithValue }) => {
    try {
      const response = await nocCloudApi.post(NOC_CLOUD.maintenance.updateWork, payload);
      return response?.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error, 'Failed to update work item'));
    }
  },
);

// POST /admin/work/create
// Request:  CreateWorkRequest  { facilityCode, type, title, category, ... }
// Response: { data: Work }
export const createWork = createAsyncThunk(
  'maintenance/createWork',
  async (payload: CreateWorkRequest, { rejectWithValue }) => {
    try {
      const response = await nocCloudApi.post(NOC_CLOUD.maintenance.createWork, payload);
      return response?.data;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error, 'Failed to create work item'));
    }
  },
);
