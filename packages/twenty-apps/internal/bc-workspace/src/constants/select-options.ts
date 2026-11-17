// Option ids are fixed after the first sync, like universal identifiers.

export const RELATIONSHIP_STATUS_OPTIONS = [
  { id: 'fb36e8ef-14f1-41ca-8b71-34fc1dd7d85e', value: 'ACTIVE', label: 'Active', position: 0, color: 'green' },
  { id: '843d7f5f-6656-4d04-814a-d1d1d7e360e9', value: 'WAITING_FOR_CLIENT', label: 'Waiting for Client', position: 1, color: 'sky' },
  { id: 'c079e5b1-3179-4adc-b718-5745df60c9ff', value: 'FOLLOW_UP', label: 'Follow-up', position: 2, color: 'orange' },
  { id: '16ebf220-78d1-4130-bd55-006f98276211', value: 'AT_RISK', label: 'At Risk', position: 3, color: 'red' },
  { id: '1de11484-11da-46e2-b37b-feca42f8246c', value: 'INACTIVE', label: 'Inactive', position: 4, color: 'gray' },
] as const;

export const BC_MEMBER_ROLE_OPTIONS = [
  { id: '11493bb5-9578-4c86-867d-3ad7c5585f99', value: 'BC', label: 'Business Consultant', position: 0, color: 'blue' },
  { id: '105a39f6-0018-44c5-8cf3-f017de4d7421', value: 'MANAGER', label: 'Manager', position: 1, color: 'purple' },
  { id: '39707f4c-638a-41b0-b2ca-c9d943ab5800', value: 'ADMIN', label: 'BC Workspace admin', position: 2, color: 'red' },
] as const;

export const ISSUE_STATUS_OPTIONS = [
  { id: '682740d5-2c2b-471d-aeec-b0a80940da6b', value: 'OPEN', label: 'Open', position: 0, color: 'red' },
  { id: '8ce8cd42-2740-4020-b364-31881188a2c3', value: 'RESOLVED', label: 'Resolved', position: 1, color: 'green' },
  { id: '9bf6f6cd-fd80-407d-aa3c-e8ce11faffb1', value: 'DISMISSED', label: 'Dismissed', position: 2, color: 'gray' },
] as const;

export const ISSUE_SOURCE_OPTIONS = [
  { id: 'd922c291-a8eb-4a53-9870-4b7eff63aee4', value: 'AI', label: 'AI detected', position: 0, color: 'purple' },
  { id: '5745826c-d124-47e1-a309-83dafc91b718', value: 'MANUAL', label: 'Manual', position: 1, color: 'gray' },
] as const;

export const TASK_CATEGORY_OPTIONS = [
  { id: '174f0265-4098-4de6-905c-70c85cd1a5e4', value: 'CLIENT_ISSUE', label: 'Client Issue', position: 0, color: 'red' },
  { id: '236d5fcc-b0ba-4857-9c8c-98d71d06e864', value: 'FOLLOW_UP', label: 'Follow-up', position: 1, color: 'orange' },
  { id: '4d7f3d86-4367-43c8-92d4-b4a7e17d96dd', value: 'UPSELL', label: 'Upsell', position: 2, color: 'green' },
  { id: 'ac090f1b-8f06-4df8-b279-88cdbe6d3542', value: 'ONBOARDING', label: 'Onboarding', position: 3, color: 'sky' },
  { id: '6d015643-68b4-44b0-a750-092c13021928', value: 'RETENTION', label: 'Retention', position: 4, color: 'purple' },
  { id: '19a5a4a9-9362-4f02-a754-accb98b55156', value: 'OTHER', label: 'Other', position: 5, color: 'gray' },
] as const;

export const TASK_STATUS_OPTIONS = [
  { id: 'b577ae96-19f2-49ca-8596-7524de0239da', value: 'TODO', label: 'To Do', position: 0, color: 'gray' },
  { id: '1cd33878-81ed-48b0-bb06-9e51ec42f4f0', value: 'IN_PROGRESS', label: 'In Progress', position: 1, color: 'blue' },
  { id: '6d81a7e0-0750-4b77-8980-4063f8eb59e7', value: 'COMPLETED', label: 'Completed', position: 2, color: 'green' },
  { id: '7bc9786b-5579-4be5-b83e-f64966623ee7', value: 'CANCELLED', label: 'Cancelled', position: 3, color: 'gray' },
] as const;

export const TASK_PRIORITY_OPTIONS = [
  { id: 'bf5fc580-cbc1-40db-a64d-211c195a4532', value: 'LOW', label: 'Low', position: 0, color: 'gray' },
  { id: '7c64a520-c160-4089-a1ed-aad14cc2f8e6', value: 'MEDIUM', label: 'Medium', position: 1, color: 'orange' },
  { id: 'a979e763-32c9-44dd-97a0-729ab16bc1fc', value: 'HIGH', label: 'High', position: 2, color: 'red' },
] as const;

export const TASK_SOURCE_OPTIONS = [
  { id: 'ed8491cd-d231-4946-8057-db3578648db6', value: 'MANUAL', label: 'Manual', position: 0, color: 'gray' },
  { id: '76a8dc82-5fc8-4aa3-bae6-8f84a228fcd2', value: 'AUTO', label: 'Automatic', position: 1, color: 'purple' },
] as const;

export const TASK_TRIGGER_TYPE_OPTIONS = [
  { id: '4afcbb4c-8451-4f11-b541-02fd66e6a18b', value: 'ISSUE', label: 'New issue', position: 0, color: 'red' },
  { id: 'fff5a38d-e8f7-4e62-9796-2880384152ac', value: 'NO_REPLY', label: 'No reply', position: 1, color: 'orange' },
  { id: 'e19b6318-dfa7-4ba4-b9ff-706b2dfc4a10', value: 'NEW_VIP', label: 'New VIP', position: 2, color: 'sky' },
  { id: '4e9842f2-9c51-4d2c-bd6f-d267e8596b35', value: 'DOWNGRADE', label: 'Downgrade', position: 3, color: 'purple' },
  { id: '750d166d-5ad0-4141-93ad-0dca5d0520ca', value: 'UNINSTALL', label: 'Uninstall', position: 4, color: 'purple' },
  { id: 'e5b198df-76c2-4283-90d8-7eeaa65d81e5', value: 'USAGE_THRESHOLD', label: 'Usage threshold', position: 5, color: 'green' },
] as const;

export const TASK_OUTCOME_STATUS_OPTIONS = [
  { id: 'e681aa24-08c8-4f9e-9c6a-5d889348bbd6', value: 'PENDING', label: 'Pending', position: 0, color: 'gray' },
  { id: '6cfe40e2-7716-483f-b0c9-fd8664b934d3', value: 'CONTACTED', label: 'Contacted', position: 1, color: 'blue' },
  { id: 'ee50e9fa-2fcc-4c3d-bb88-8e29055cdb29', value: 'CONVERTED', label: 'Converted', position: 2, color: 'green' },
  { id: '22031a17-c130-48cb-b6aa-921abd6380fc', value: 'NOT_INTERESTED', label: 'Not Interested', position: 3, color: 'orange' },
  { id: '472a86eb-1458-4f85-97c2-8a949549b421', value: 'NOT_QUALIFIED', label: 'Not Qualified', position: 4, color: 'gray' },
] as const;

export const ACTIVITY_TYPE_OPTIONS = [
  { id: '4f77877b-a857-49a5-b04f-20a7f2278c3c', value: 'CRISP_MESSAGE', label: 'Crisp message', position: 0, color: 'blue' },
  { id: 'e9d87e40-096a-4480-99f2-f598f5d40d55', value: 'EMAIL', label: 'Email', position: 1, color: 'sky' },
  { id: '0a374147-607d-4065-ab94-141b3fc695b4', value: 'MEETING', label: 'Meeting', position: 2, color: 'purple' },
  { id: 'c62dfa85-dea9-4381-a260-e1c696ab3d27', value: 'CALL', label: 'Phone call', position: 3, color: 'turquoise' },
  { id: '5ba8c940-05b9-4621-9657-bf2a12c4471f', value: 'NOTE', label: 'Note', position: 4, color: 'gray' },
  { id: '583e8441-08a9-4a01-b6e6-6bd1f7fd22fa', value: 'REVIEW_REQUEST', label: 'Review request', position: 5, color: 'yellow' },
  { id: '0d0e979d-0276-4c12-84df-6f26fbf44f80', value: 'PIC_CHANGE', label: 'PIC change', position: 6, color: 'gray' },
  { id: '6436db4d-6371-482a-88a7-92c5a3776de3', value: 'STATUS_CHANGE', label: 'Status change', position: 7, color: 'gray' },
  { id: '850822e7-865d-4df6-a665-360eec18b8ed', value: 'ISSUE_DETECTED', label: 'Issue detected', position: 8, color: 'red' },
  { id: 'e60f958f-5e29-4fed-9d92-7fd12605738a', value: 'ISSUE_UPDATED', label: 'Issue updated', position: 9, color: 'orange' },
  { id: '108fc06b-f1af-4f91-9ea2-a6c5479e28f1', value: 'ISSUE_RESOLVED', label: 'Issue resolved', position: 10, color: 'green' },
  { id: 'b952e8ed-d860-490c-b7f1-d997c9c6a9ff', value: 'ISSUE_DISMISSED', label: 'Issue dismissed', position: 11, color: 'gray' },
  { id: 'bd8fdf10-41f7-4412-a7e7-46d309d494ae', value: 'TASK', label: 'Task', position: 12, color: 'gray' },
  { id: '51b026e8-2619-49d8-9d42-96107b9ca85b', value: 'DEVELOPER_TASK', label: 'Developer task', position: 13, color: 'blue' },
  { id: '446eeae5-ff5e-48c8-9e28-cf81d61e874d', value: 'SUBSCRIPTION', label: 'Subscription', position: 14, color: 'purple' },
  { id: 'd443e3a7-c58a-470b-9fc6-c8bfa74dd5dc', value: 'USAGE', label: 'Usage', position: 15, color: 'green' },
  { id: '199dff6e-ca0f-4be2-a46c-26ecb30d7877', value: 'REVIEW', label: 'Review', position: 16, color: 'yellow' },
  { id: 'c2f7c7d9-8651-496f-bbf7-c84d19725767', value: 'SYSTEM', label: 'System', position: 17, color: 'gray' },
] as const;

export const ACTIVITY_DIRECTION_OPTIONS = [
  { id: '4d8aae08-4303-49cc-8adb-8d82536592b6', value: 'OUTBOUND', label: 'Outbound', position: 0, color: 'blue' },
  { id: '5a7f7b65-a14a-40d3-93b4-fddb853cb751', value: 'INBOUND', label: 'Inbound', position: 1, color: 'orange' },
  { id: '5f01f3c4-c639-4590-aa05-323b821b936d', value: 'INTERNAL', label: 'Internal', position: 2, color: 'gray' },
] as const;

export const ACTIVITY_TOPIC_OPTIONS = [
  { id: '9a9d8426-7f2b-48af-8254-6210d1cdc675', value: 'GENERAL', label: 'General', position: 0, color: 'gray' },
  { id: 'a715b87b-d276-45ff-a3b0-4faf1669b6f6', value: 'UPSELL', label: 'Upsell', position: 1, color: 'green' },
  { id: '304ee913-ac6d-4832-9628-66e3eebab669', value: 'REVIEW', label: 'Review', position: 2, color: 'yellow' },
  { id: '7185c63d-7573-4349-b7d1-4ef07f93d2da', value: 'ISSUE', label: 'Issue', position: 3, color: 'red' },
  { id: '64141834-f0a9-43f5-88b9-ac4e19313ef8', value: 'ONBOARDING', label: 'Onboarding', position: 4, color: 'sky' },
  { id: '81bbb504-d3cb-4a2c-9251-c98f8daa69da', value: 'RETENTION', label: 'Retention', position: 5, color: 'purple' },
] as const;

export const MEETING_STATUS_OPTIONS = [
  { id: 'e05dee42-34a5-4a2b-b9d9-2f1721384f87', value: 'SCHEDULED', label: 'Scheduled', position: 0, color: 'blue' },
  { id: 'da4beae6-515d-4dc5-a8b8-1e2c0dcbbaf4', value: 'COMPLETED', label: 'Completed', position: 1, color: 'green' },
  { id: '909e86aa-3f48-49c9-8bdc-0e4868846e71', value: 'CANCELLED', label: 'Cancelled', position: 2, color: 'gray' },
] as const;

export const RECORD_SOURCE_OPTIONS = [
  { id: '17157f7c-0784-4939-b4d1-e9a8811b606d', value: 'MANUAL', label: 'Manual', position: 0, color: 'gray' },
  { id: '2bb5bd30-957f-4bcb-bbcc-8296c2adfc93', value: 'INGEST', label: 'Integration', position: 1, color: 'blue' },
  { id: '23427d61-d68a-4693-9d25-2b3ac386a5cc', value: 'CRM_SYNC', label: 'CRM sync', position: 2, color: 'purple' },
] as const;

export const SUBSCRIPTION_EVENT_TYPE_OPTIONS = [
  { id: '8ef91449-0c54-4cd3-9113-5b7c0dd1644d', value: 'INSTALL', label: 'Install', position: 0, color: 'sky' },
  { id: 'c2ff7fe5-92a0-49f9-bcb0-6c0c1b18fad6', value: 'UPGRADE', label: 'Upgrade', position: 1, color: 'green' },
  { id: 'ea5de4e9-39a2-44b9-a9a2-44b3f978a6bd', value: 'DOWNGRADE', label: 'Downgrade', position: 2, color: 'orange' },
  { id: '89f2ae70-a5c6-40c7-af98-3cf1f44bebab', value: 'UNINSTALL', label: 'Uninstall', position: 3, color: 'red' },
  { id: 'e7ab3f8e-e2b4-493c-9d2f-491cd2734387', value: 'REINSTALL', label: 'Reinstall', position: 4, color: 'blue' },
  { id: '1042791f-e3e7-417d-9d5e-60c0b715bf66', value: 'CANCEL', label: 'Cancel', position: 5, color: 'red' },
] as const;

export const OPPORTUNITY_STATUS_OPTIONS = [
  { id: '228a0040-7c32-4c03-b344-b17dbc1ba43f', value: 'OPEN', label: 'Open', position: 0, color: 'blue' },
  { id: '9d97321f-c1f6-46e4-8417-8094e148dd7e', value: 'CONVERTED', label: 'Converted', position: 1, color: 'green' },
  { id: '078a3bf1-54de-4916-97fb-adb274921ab7', value: 'LOST', label: 'Lost', position: 2, color: 'gray' },
] as const;

export const PAYMENT_KIND_OPTIONS = [
  { id: '29678ed8-160f-4b94-b45f-66f0b4900a61', value: 'CHARGE', label: 'Charge', position: 0, color: 'green' },
  { id: '97388cab-445a-4b3c-9fd8-fd791663db3f', value: 'REFUND', label: 'Refund', position: 1, color: 'red' },
] as const;
