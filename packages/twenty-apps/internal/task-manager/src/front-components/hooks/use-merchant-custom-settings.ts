import { useCallback, useEffect, useState } from 'react';

import {
  MERCHANT_CUSTOM_SETTINGS_ROUTE_PATH,
  RUN_MERCHANT_CUSTOM_SETTING_TOOL_ROUTE_PATH,
  UPDATE_MERCHANT_CUSTOM_SETTINGS_ROUTE_PATH,
} from '../../constants/route-paths';
import {
  type CustomSettingDraftValue,
  type CustomSettingSchema,
  type CustomSettingValues,
} from '../../types/custom-setting-schema';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

type MerchantCustomSettings = {
  schema: CustomSettingSchema;
  values: CustomSettingValues;
  canUpdate: boolean;
  uploadFieldMetadataId: string | null;
};

const EMPTY_SCHEMA: CustomSettingSchema = { fields: [], tools: [] };

const EMPTY_SETTINGS: MerchantCustomSettings = {
  schema: EMPTY_SCHEMA,
  values: {},
  canUpdate: false,
  uploadFieldMetadataId: null,
};

export const useMerchantCustomSettings = (merchantId: string | null) => {
  const [data, setData] = useState<MerchantCustomSettings>(EMPTY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (merchantId === null) {
      setData(EMPTY_SETTINGS);
      setIsLoading(false);

      return;
    }

    setIsLoading(true);

    try {
      const result = await postAppRoute<{
        schema?: CustomSettingSchema;
        values?: CustomSettingValues;
        canUpdate?: boolean;
        uploadFieldMetadataId?: string | null;
      }>(MERCHANT_CUSTOM_SETTINGS_ROUTE_PATH, { merchantId });

      setData({
        schema: result.schema ?? EMPTY_SCHEMA,
        values: result.values ?? {},
        canUpdate: result.canUpdate === true,
        uploadFieldMetadataId: result.uploadFieldMetadataId ?? null,
      });
      setLoadError(null);
    } catch (error) {
      setData(EMPTY_SETTINGS);
      setLoadError(readErrorText(error));
    } finally {
      setIsLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Answers with the values the server actually stored, so the widget behind
  // the form shows the merged record rather than the half of it this form
  // knows about.
  const save = useCallback(
    async (values: CustomSettingValues): Promise<CustomSettingValues> => {
      const result = await postAppRoute<{ values?: CustomSettingValues }>(
        UPDATE_MERCHANT_CUSTOM_SETTINGS_ROUTE_PATH,
        { merchantId, values },
      );

      const savedValues = result.values ?? values;

      setData((current) => ({ ...current, values: savedValues }));

      return savedValues;
    },
    [merchantId],
  );

  // A tool's run is independent of the settings form: it writes only its own
  // key, so the answer here folds straight into state the same way `save`'s
  // does, without disturbing any draft the settings tab is mid-edit on.
  const runTool = useCallback(
    async (
      toolKey: string,
      params: Record<string, CustomSettingDraftValue>,
    ): Promise<void> => {
      const result = await postAppRoute<{ values?: CustomSettingValues }>(
        RUN_MERCHANT_CUSTOM_SETTING_TOOL_ROUTE_PATH,
        { merchantId, toolKey, params },
      );

      const nextValues = result.values;

      if (nextValues !== undefined) {
        setData((current) => ({ ...current, values: nextValues }));
      }
    },
    [merchantId],
  );

  return { ...data, isLoading, loadError, reload, save, runTool };
};
