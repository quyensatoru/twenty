# Twenty CRM — Architecture & Customization Guide

> Tài liệu kiến trúc + design system của product app (`twenty-front` / `twenty-ui` / `twenty-server`), viết để làm nền cho việc custom thêm module/tính năng.
>
> **Phiên bản khảo sát:** Twenty ~2.23-alpha (package version `0.2.1`), Nx 22.7.5 monorepo, React 19, NestJS, PostgreSQL, Yarn 4, Node 24.
>
> **Lưu ý phân biệt tài liệu:** `DESIGN.md` và `PRODUCT.md` ở root chỉ mô tả **marketing site** (`twenty-website`), KHÔNG phải product app. Tài liệu này nói về product app.
>
> **CẢNH BÁO version:** hầu hết docs/tutorial Twenty trên mạng mô tả mô hình `@WorkspaceEntity` / `@WorkspaceField` decorator + `STANDARD_OBJECT_IDS`. **Bản này đã bỏ hết** (xem [§6.4](#64-standard-objects-định-nghĩa-bằng-code) và [§7](#7-hai-cách-mở-rộng-quan-trọng-nhất)). Đừng đi theo tutorial cũ.

## Mục lục

1. [Tổng quan & triết lý cốt lõi](#1-tổng-quan--triết-lý-cốt-lõi)
2. [Cấu trúc monorepo](#2-cấu-trúc-monorepo)
3. [Design System](#3-design-system)
4. [Frontend architecture (twenty-front)](#4-frontend-architecture-twenty-front)
5. [Backend architecture (twenty-server)](#5-backend-architecture-twenty-server)
6. [Metadata Engine — trái tim của Twenty](#6-metadata-engine--trái-tim-của-twenty)
7. [HAI cách mở rộng (quan trọng nhất)](#7-hai-cách-mở-rộng-quan-trọng-nhất)
8. [Quick reference: bản đồ file](#8-quick-reference-bản-đồ-file)

---

## 1. Tổng quan & triết lý cốt lõi

Twenty là CRM open-source **metadata-driven**. Đây là ý tưởng phải nắm trước mọi thứ khác, vì nó quyết định cách toàn bộ app vận hành và cách bạn mở rộng nó.

**Metadata-driven nghĩa là:** không có code riêng cho từng object (Person, Company, Opportunity...). Thay vào đó:

- Mỗi object và field được mô tả bằng **metadata** (lưu trong bảng `core.objectMetadata` / `core.fieldMetadata`).
- Backend **tự sinh** ra bảng Postgres thật, GraphQL schema, và resolver CRUD từ metadata đó — cho từng workspace.
- Frontend **tự render** table, kanban, record detail, field editor, filter, sort... từ metadata, qua đúng một bộ view generic.

Hệ quả trực tiếp cho việc custom:

- **Standard object và custom object là một.** Cả hai chỉ là row trong `objectMetadata`. Object bạn thêm chạy qua đúng code path như Company/Person, không cần code riêng.
- **Có 2 tầng mở rộng:**
  - **Runtime (no-code):** user tạo object/field trong Settings > Data model, hoặc qua metadata GraphQL API. Không cần deploy.
  - **Code-level (standard object):** bạn định nghĩa object trong source, nó thành "built-in" cho mọi workspace. Đây là cách thêm module tính năng thật sự.

```
┌─────────────────────────────────────────────────────────────┐
│  Định nghĩa object/field (metadata)                           │
│  ├── Code:    STANDARD_OBJECTS registry + flat-metadata builder│
│  └── Runtime: user tạo qua Settings UI → metadata GraphQL API  │
└───────────────────────────┬───────────────────────────────────┘
                            │  workspace-migration engine (diff + apply)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Postgres: core.objectMetadata/fieldMetadata (mô tả)           │
│          + workspace_<hash>.<table>       (dữ liệu thật)       │
└───────────────────────────┬───────────────────────────────────┘
                            │  auto-generate
              ┌─────────────┴─────────────┐
              ▼                           ▼
   GraphQL schema + CRUD resolver   Frontend generic views
   (per-workspace)                  (RecordTable/Board/Show)
```

---

## 2. Cấu trúc monorepo

21 package trong `packages/`. Những package cần biết cho việc custom:

| Package | Vai trò |
|---|---|
| `twenty-front` | React app (product UI). Nơi chứa toàn bộ logic frontend + Linaria styling. |
| `twenty-server` | NestJS backend. Metadata engine, workspace migration, GraphQL generation, ORM. |
| `twenty-ui` | Component library dùng chung (Button, Chip, Card, Modal, icon...). CSS Modules + SCSS. |
| `twenty-shared` | Types + constants dùng chung 2 đầu. **Chứa `STANDARD_OBJECTS` UUID registry** và `AppPath`. |
| `twenty-emails` | Email template (React Email). |
| `twenty-cli` / `twenty-sdk` / `twenty-client-sdk` | CLI + SDK cho app/integration bên ngoài. |

Path alias chính: `@/<module>` (twenty-front internal), `~/...` (twenty-front src root), `twenty-ui/<group>`, `twenty-shared/*`, `@ui/*` (twenty-ui internal).

---

## 3. Design System

### 3.1. Điểm mấu chốt: styling 2 tầng, đang migrate

Đây là điều CLAUDE.md ghi sai ("Linaria everywhere"). Thực tế:

| Tầng | Cách styling | Ghi chú |
|---|---|---|
| **twenty-ui** (library) | **CSS Modules** (`.module.scss`) + `clsx` + `data-*` attribute + CSS custom properties | 129 file `.module.scss`, **0** file Linaria |
| **twenty-front** (app) | **Linaria** `styled` (named import) + `themeCssVariables` | 1116 file dùng `styled` |

**Cả hai tầng đọc chung một nguồn:** các CSS variable `--t-*`. Emotion đã bị bỏ (còn 2 file sót).

### 3.2. Theme system

Nguồn chân lý runtime: `packages/twenty-ui/src/theme-constants/`

- `theme-light.css` / `theme-dark.css` — định nghĩa mọi token dưới dạng biến `--t-*` trong class `.light {}` / `.dark {}` (vd `--t-spacing-2: 8px`, `--t-icon-size-md: 16`). Ship ra thành `twenty-ui/theme-light.css`.
- `themeCssVariables.ts` — object JS mirror cây đó, **lá là string `'var(--t-…)'`**. Đây là cái Linaria nội suy (zero-runtime).
- `ThemeProvider.tsx` — set class `.light`/`.dark` lên `document.documentElement`, rồi `computeThemeFromCss()` đọc `getComputedStyle` để resolve ra giá trị số cho React context. Hỗ trợ scoped override.
- `useTheme.ts` — trả về `ThemeType` đã resolve (giá trị số); dùng khi JS cần giá trị thật. `useThemeColorScheme.ts` → `'light' | 'dark'`.

Token gốc (TS objects, phần lớn để tham chiếu / giá trị theme-invariant): `packages/twenty-ui/src/theme/constants/`
- Colors: `ColorsLight/Dark.ts`, `MainColorsLight/Dark.ts` (25 màu, nguồn từ `@radix-ui/colors` P3), `GrayScale*`, `Accent*`.
- Spacing: `ThemeCommon.ts` → `spacing(n) = n * 4px`. Vậy `theme.spacing(2)` = `8px`.
- Font: `FontCommon.ts` → `size` (xxs…xxl, rem), `weight` (regular 400 / medium 500 / semiBold 600), `family: 'Inter, sans-serif'`.
- Border radius: `BorderCommon.ts` → `xs:2px … xxl:40px`, `pill:999px`, `rounded:100%`.
- Shadow: `BoxShadowLight/Dark.ts`. Animation: `Animation.ts` (`duration.fast:0.15s`...).

**App wiring:**
- CSS load 1 lần ở `packages/twenty-front/src/index.tsx` (`import 'twenty-ui/style.css'` + `theme-light.css` + `theme-dark.css`).
- `packages/twenty-front/src/modules/ui/theme/components/BaseThemeProvider.tsx` đọc scheme (Jotai `persistedColorSchemeState` + `useSystemColorScheme`) rồi render `<ThemeProvider>`.

### 3.3. Cách viết styled component

**Trong twenty-front (Linaria):**

```tsx
// packages/twenty-front/src/modules/ui/input/components/TextInput.tsx
import { styled } from '@linaria/react';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div<Pick<TextInputComponentProps, 'fullWidth'>>`
  display: inline-flex;
  width: ${({ fullWidth }) => (fullWidth ? `100%` : 'auto')};
`;

const StyledAdornmentContainer = styled.div<StyledAdornmentContainerProps>`
  background-color: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.medium};
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
`;
```

Quy ước: dùng `themeCssVariables.*` cho token tĩnh (giữ zero-runtime), prop-callback cho giá trị động, `useTheme()` chỉ khi JS cần số. Đặt tên `StyledX`, khai báo ở đầu module trên component.

**Trong twenty-ui (CSS Modules):**

```tsx
// packages/twenty-ui/src/input/Button/Button.tsx
import styles from './Button.module.scss';

<ButtonComponent
  className={clsx(styles.button, styles[size], fullWidth && styles.fullWidth, className)}
  data-variant={variant}
  data-accent={accent}
  data-disabled={isDisabled || undefined}
  style={{ '--btn-justify': justify } as React.CSSProperties}
/>
```

SCSS match trên data-attribute và đọc `--t-*` var: `border-radius: var(--btn-radius, var(--t-border-radius-md));`. Mỗi `.module.scss` có sibling `.module.scss.d.ts` (typed class names, auto-gen).

### 3.4. Cấu trúc component library (twenty-ui)

Nhóm dưới `packages/twenty-ui/src/`: `data-display/`, `input/`, `feedback/`, `layout/`, `navigation/`, `surfaces/`, `typography/`, `icon/`, `accessibility/`, `utilities/`, `json-visualizer/`.

Mỗi nhóm có `index.ts` barrel (auto-generated, có banner "Any edits will be overridden") re-export component + types + constants. Consumer import qua subpath, **không import deep path**:

```ts
import { Button } from 'twenty-ui/input';
import { Chip, Tag } from 'twenty-ui/data-display';
import { useIcons } from 'twenty-ui/icon';
```

**Primitive chính:**
- `twenty-ui/src/input/Button/Button.tsx` (variant `primary|secondary|tertiary`; accent `default|blue|danger|green`; size `medium|small`), `IconButton/` (+ Light/Floating/Rounded).
- `twenty-ui/src/data-display/Chip/`, `Tag/` (+ `Pill`, `Status`, `LinkChip`).
- `twenty-ui/src/surfaces/Card/`, `Modal/`, `AppTooltip/` (tooltip primitive tên là `AppTooltip`).
- `twenty-ui/src/input/Toggle/`, `Checkbox/`, `Radio/`.
- Input phức tạp/stateful nằm ở **app** chứ không phải library: `twenty-front/src/modules/ui/input/components/TextInput.tsx`, `.../layout/dropdown/components/Dropdown.tsx`, `.../input/components/Select.tsx`.

### 3.5. Icons

`packages/twenty-ui/src/icon/`:
- `components/TablerIcons.ts` — chỗ **duy nhất** được import `@tabler/icons-react` trực tiếp (có `oxlint-disable no-restricted-imports`). Nơi khác import Tabler sẽ bị lint chặn.
- `types/IconComponent.ts` — contract `IconComponent` với props `{ className?, style?, size?, stroke?, color? }`. Dùng khắp nơi (`Icon?: IconComponent` trên Button...).
- `hooks/useIcons.ts` → `{ getIcons, getIcon }`. `getIcon(name)` resolve string key (metadata-driven) từ registry, fallback `Icon123`.
- Icon động theo tên: `<Icon name="IconSearch" />` (`components/Icon.tsx`).

### 3.6. Cách thêm 1 UI component mới

Layout 1 thư mục / component (ví dụ `twenty-ui/src/input/Button/`):
```
Button/
  Button.tsx                 # component (functional, named export)
  Button.module.scss         # styles
  Button.module.scss.d.ts    # typed class names (auto-gen)
  constant.ts                # constants (optional)
  internal/                  # sub-part private
  __stories__/Button.stories.tsx
```
Quy ước: styling qua `--t-*` var (không hardcode màu/spacing); nhận `Icon?: IconComponent` (không import Tabler trực tiếp); story CSF3 `title: 'UI/<Group>/<Name>'`; export `NameProps` cạnh component; thêm vào barrel `index.ts` bằng **generator** (đừng sửa tay vì có banner auto-gen).

---

## 4. Frontend architecture (twenty-front)

### 4.1. Cấu trúc `src/`

| Dir | Vai trò |
|---|---|
| `modules/` | Toàn bộ code feature (phần lớn app) |
| `pages/` | Route entry mỏng (`auth/`, `object-record/`, `settings/`...) |
| `generated/`, `generated-metadata/`, `generated-admin/` | Output GraphQL Codegen (`graphql.ts`) |
| `config/`, `hooks/`, `utils/`, `types/`, `locales/` | Glue cross-cutting |

**Feature module chính** (`src/modules/`): `object-record`, `object-metadata`, `metadata-store`, `views`, `activities`, `auth`, `settings`, `command-menu`, `navigation`, `page-layout`, `workflow`, `apollo`, `ui`, `app`, + domain folder `companies`, `people`, `dashboards`...

**Pattern mỗi module (nhất quán):**
```
<module>/
  components/   React components
  hooks/        use*.ts (private → hooks/internal/, test → __tests__/)
  states/       Jotai atoms/selectors (*.state.ts, *ComponentState.ts, *Selector.ts)
  graphql/      gql documents (queries.ts, mutations.ts, fragment.ts)
  types/        TS types & enums
  utils/        pure helpers
  constants/    constants
  contexts/     React contexts
```
`object-record` là module lớn nhất, chia sub-feature cùng shape: `record-table/`, `record-board/`, `record-show/`, `record-index/`, `record-field/`, `record-filter/`, `record-sort/`, `record-picker/`, `cache/`.

### 4.2. State management — Jotai (qua wrapper layer)

**Confirmed: Jotai** (546 import), **0 Recoil**. App **không** gọi `atom()` thẳng — dùng factory + hook ở `packages/twenty-front/src/modules/ui/utilities/state/`:

- Factory (`state/jotai/utils/`): `createAtomState`, `createAtomFamilyState`, `createAtomSelector`, `createAtomComponentState`, `createAtomComponentSelector`...
- Hook (`state/jotai/hooks/`): `useAtomState`, `useAtomStateValue`, `useSetAtomState`, `useAtomComponentStateValue`...
- Component-scope primitive (`state/component-state/`): `createComponentInstanceContext`, `globalComponentInstanceContextMap`.

**Global atom:**
```ts
// object-metadata/states/objectMetadataItemsSelector.ts
export const objectMetadataItemsSelector = createAtomSelector<EnrichedObjectMetadataItem[]>({
  key: 'objectMetadataItemsSelector',
  get: ({ get }) => get(objectMetadataItemsWithFieldsSelector),
});
```

**Component-scoped state** (pattern quan trọng — cùng 1 atom dùng lại bởi nhiều instance, key bằng `instanceId` lấy từ React context; factory giữ `Map<instanceId, atom>`):
```ts
// record-table/states/activeRecordTableRowIndexComponentState.ts
export const activeRecordTableRowIndexComponentState = createAtomComponentState<number | null>({
  key: 'activeRecordTableRowIndexComponentState',
  defaultValue: null,
  componentInstanceContext: RecordTableComponentInstanceContext,
});
// đọc: instanceId resolve từ context provider gần nhất (hoặc prop)
const rowIndex = useAtomComponentStateValue(activeRecordTableRowIndexComponentState, recordTableId);
```
Quy ước tên: `xxxState` (global), `xxxFamilyState`, `xxxSelector`, `xxxComponentState`.

### 4.3. Data layer — Apollo + GraphQL sinh từ metadata

Đây là phần làm Twenty "generic". **Query record KHÔNG viết tay cho từng object** — build động từ object metadata:

1. **Load metadata 1 lần, cache vào Jotai.** Query bootstrap `FIND_MANY_OBJECT_METADATA_ITEMS` (`object-metadata/graphql/queries.ts`). Module mới `metadata-store/` quản lý store persist (IndexedDB) + sync SSE; `MinimalMetadataGate` chặn app tới khi ready.
2. **Đọc metadata qua hook + selector:** `object-metadata/hooks/useObjectMetadataItem.ts` (`{ objectNameSingular }` → 1 item), `useObjectMetadataItems.ts` (tất cả).
3. **Sinh query string động:**
```ts
// object-record/utils/generateFindManyRecordsQuery.ts
gql`query FindMany${capitalize(namePlural)}($filter: ..., $orderBy: ..., ...) {
  ${namePlural}(filter:$filter, orderBy:$orderBy, first:$limit, after:$lastCursor) {
    edges { node ${mapObjectMetadataToGraphQLQuery({...})} cursor }
    pageInfo { hasNextPage endCursor } totalCount
  }
}`
```
`mapObjectMetadataToGraphQLQuery` (`object-metadata/utils/`) duyệt `readableFields`, lọc field active/queryable/có permission, expand relation MANY_TO_ONE, đệ quy vào nested object. Tôn trọng `objectPermissionsByObjectMetadataId`.
4. **Hook nối vào Apollo:** `object-record/hooks/useFindManyRecords.ts` (+ `useFindOneRecord`, `useCreateOneRecord`, `useUpdateOneRecord`, `useDeleteOneRecord`, `useAggregateRecordsQuery`, `useGroupByRecordsQuery`...). Multi-object: `object-record/multiple-objects/`.

Apollo setup ở `modules/apollo/`: 2 client — **core** (`useApolloCoreClient`, data record) và **metadata** (schema ops). Optimistic cache ở `apollo/optimistic-effect/utils/`.

> **Standard vs custom object giống hệt nhau** ở frontend — đều là row metadata, đều chạy qua `generateFindManyRecordsQuery`. Không có file query riêng cho object nào.

### 4.4. Routing

`react-router-dom` `createBrowserRouter`. Route tree JSX qua `createRoutesFromElements`, page là `React.lazy` + `lazyWithPreload` bọc trong `<LazyRoute>`.

- 2 router: `useCreateRootAppRouter.tsx` (public shell) và `useCreateWorkspaceAppRouter.tsx` (app đã auth) — `modules/app/hooks/`.
- **Path constant tập trung** ở `packages/twenty-shared/src/types/AppPath.ts` (enum `AppPath`, `SettingsPath`). 3 route record generic:
```
RecordIndexPage = '/objects/:objectNamePlural'
RecordShowPage  = '/object/:objectNameSingular/:objectRecordId'
PageLayoutPage  = '/page/:pageLayoutId'
```
- Nesting: `WorkspaceAppProviders` → `MinimalMetadataGate` → `DefaultLayout` → `MainAppLayoutWithSidePanel` → record/settings routes.
- Settings là sub-tree `<Routes>` riêng: `modules/app/components/SettingsRoutes.tsx`.

### 4.5. Record system — 1 code path cho mọi object

**Index (list):**
```
pages/object-record/RecordIndexPage.tsx
  → resolve objectMetadataItem từ contextStore
  → RecordIndexContainerGater.tsx (build context, mount provider stack)
  → RecordIndexContainer.tsx  switch theo view type:
       TABLE    → RecordTable
       KANBAN   → RecordBoardContainer
       CALENDAR → RecordIndexCalendarContainer
```
`RecordTable` đọc hết từ `useRecordTableContextOrThrow()` + component-state key bằng `recordTableId`; cột lấy từ view fields, không hardcode.

**Show (detail):** `pages/object-record/RecordShowPage.tsx` đọc `:objectNameSingular/:objectRecordId`, render `PageLayoutRecordPageRenderer` — tab/card lấy từ page-layout metadata.

**Field render dispatch theo TYPE, không theo object:** `record-field/ui/components/FieldDisplay.tsx` là chuỗi type-guard (`isFieldText`, `isFieldCurrency`, `isFieldRelationManyToOne`...) chọn component từ `meta-types/display/components/` (~25 loại: `TextFieldDisplay`, `CurrencyFieldDisplay`...). Editable ở `meta-types/input/`. Vậy field của bất kỳ `FieldMetadataType` nào render không cần code riêng.

> **Net:** URL param → tra object-metadata → GraphQL sinh động → table/board/show generic → field component theo type. **Không có file per-object nào trong render path.**

### 4.6. Cách thêm feature/module frontend

- **Module mới:** tạo `src/modules/<feature>/` với subfolder chuẩn. Atom qua factory `createAtom*` (không `atom()` thẳng). Data hook compose lại các CRUD hook của `object-record`. gql ở `graphql/`, chạy codegen. Test `__tests__/` colocate.
- **Page + route mới:** (1) tạo page mỏng ở `src/pages/<area>/`; (2) thêm path vào enum `AppPath`/`SettingsPath` ở `twenty-shared`; (3) đăng ký `lazy(...)` + `<Route>` trong `useCreateWorkspaceAppRouter.tsx` (hoặc `SettingsRoutes.tsx`).
- **Object mới:** **không cần làm gì ở frontend** — metadata-store nhận object mới và mọi view/route generic chạy tự động.

---

## 5. Backend architecture (twenty-server)

### 5.1. `engine/` vs `modules/`

Wire trong `app.module.ts`. Chia: **`engine/` = platform/framework**, **`modules/` = business domain**.

**`engine/` subsystem chính** (`packages/twenty-server/src/engine/`):

| Dir | Vai trò |
|---|---|
| `api/graphql/` | Sinh GraphQL schema/resolver + query runner (data & metadata API) |
| `api/rest/`, `api/mcp/` | REST + MCP API trên cùng metadata |
| `metadata-modules/` | **Metadata engine** — `object-metadata`, `field-metadata`, `index-metadata`, ~40 module `flat-*` |
| `workspace-manager/` | Provision workspace, `twenty-standard-application` (định nghĩa standard object), `workspace-migration` (diff+apply schema) |
| `twenty-orm/` | ORM custom trên TypeORM: `WorkspaceRepository`, `workspace-schema-manager` (DDL), `global-workspace-datasource` |
| `workspace-datasource/` | Connection + đặt tên/tạo schema per-workspace |
| `core-modules/` | Feature non-metadata: auth, workspace, user, billing, feature-flag, i18n, file, cache |
| `guards/`, `middlewares/` | Auth/request pipeline |

**`modules/` (business domain):** `person`, `company`, `opportunity`, `note`, `task`, `attachment`, `calendar`, `messaging`, `workflow`, `dashboard`, `workspace-member`... — gộp bởi `src/modules/modules.module.ts`.

**API endpoints** (từ `app.module.ts`):
- `/graphql` — **core workspace-data API** (scope `'core'`), auto-generated per workspace.
- `/metadata` — **metadata API** (scope `'metadata'`), CRUD trên chính metadata.
- `/admin-panel` — admin. `/rest/*`, `/mcp` — REST + MCP.
- 3 cái đầu qua middleware `GraphQLHydrateRequestFromTokenMiddleware` + `WorkspaceAuthContextMiddleware`.

### 5.2. Auth & request pipeline (tóm tắt)

Middleware: (1) `graphql-hydrate-request-from-token.middleware.ts` validate token, set `request.user` + `request.workspace`; (2) `workspace-auth-context.middleware.ts` build auth context (permission, feature flag) cho twenty-orm.

Guards (`engine/guards/`): `jwt-auth.guard.ts`, `require-access-token.guard.ts`, `workspace-auth.guard.ts` (thin, chỉ assert đã hydrate), `settings-permission.guard.ts`, `feature-flag.guard.ts`... Phân biệt loại auth context (user/API-key/application/system) ở `core-modules/auth/guards/is-*-auth-context.guard.ts`.

---

## 6. Metadata Engine — trái tim của Twenty

### 6.1. Mô hình 2 tầng Postgres

- **1 schema `core` chung** giữ TẤT CẢ metadata + platform table: `objectMetadata`, `fieldMetadata`, `workspace`, `user`... Load từ cả `engine/core-modules/**/*.entity` và `engine/metadata-modules/**/*.entity` (`database/typeorm/core/core.datasource.ts`, `schema: 'core'`). **Không còn schema `metadata` riêng** ở bản này.
- **Schema per-workspace** giữ data record thật, 1 schema/workspace, tên `workspace_<base36(uuid)>`:
```ts
// engine/workspace-datasource/utils/get-workspace-schema-name.util.ts
export const getWorkspaceSchemaName = (workspaceId: string): string =>
  `workspace_${uuidToBase36(workspaceId)}`;
```

### 6.2. Bảng metadata + SyncableEntity

`ObjectMetadataEntity` (`engine/metadata-modules/object-metadata/object-metadata.entity.ts`) và `FieldMetadataEntity` đều extends `SyncableEntity`:

```ts
// engine/workspace-manager/types/syncable-entity.interface.ts
@Index(['workspaceId', 'universalIdentifier'], { unique: true })
export abstract class SyncableEntity extends WorkspaceRelatedEntity {
  @Column({ type: 'uuid' }) universalIdentifier: string;  // identity ổn định (xem §6.3)
  @Column({ type: 'uuid' }) applicationId: string;         // app nào sở hữu metadata này
  @ManyToOne('ApplicationEntity', ...) application;
}
```
Mỗi row metadata scope bằng `(workspaceId, applicationId, universalIdentifier)`. `FieldMetadataEntity` có `type` (`FieldMetadataType`: TEXT, EMAILS, RELATION, FULL_NAME...) + jsonb `options`/`settings`/`defaultValue`.

**Object có bảng Postgres thật thế nào:** metadata row là *mô tả*; bảng vật lý do migration runner tạo, chạy **2 phase**:
```ts
// workspace-migration/workspace-migration-runner/action-handlers/object/services/create-object-action-handler.service.ts
async executeForMetadata(ctx)        { /* INSERT vào core.objectMetadata + fieldMetadata */ }
async executeForWorkspaceSchema(ctx) { /* CREATE TABLE workspace_xxx.<table> + columns */ }
```
Thêm field sau → `create-field-action-handler.service.ts` → `columnManager.addColumns()`. DDL executor ở `engine/twenty-orm/workspace-schema-manager/` (table/column/index/enum/foreign-key manager). Composite type (`FULL_NAME`, `EMAILS`, `LINKS`, `PHONES`, `ACTOR`) expand thành nhiều column vật lý (`generate-column-definitions.util.ts`).

### 6.3. universalIdentifier (thay cho STANDARD_*_IDS cũ)

`STANDARD_OBJECT_IDS`/`STANDARD_FIELD_IDS` numeric cũ **đã bị bỏ** (xem migration `remove-object-metadata-standard-id`). Thay bằng **UUID `universalIdentifier` deterministic** trong `twenty-shared`:

```ts
// packages/twenty-shared/src/metadata/constants/standard-object.constant.ts  (~2950 dòng)
// - Never ever mutate an existing universal identifier
// - System field IDs (id, createdAt, updatedAt, deletedAt, createdBy,
//   updatedBy, position, searchVector) derived deterministically from
//   app-uid + object-uid + field name.
export const STANDARD_OBJECTS = {
  attachment: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
    fields: {
      ...buildStandardObjectSystemFields(STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment),
      name: { universalIdentifier: '20202020-87a5-48f8-bbf7-ade388825a57' },
      targetPerson: { universalIdentifier: getSystemRelationFieldUniversalIdentifier({...}) },
    },
  },
};
```

**Tại sao phải deterministic:** sync engine match metadata code-defined với row DB bằng `(workspaceId, universalIdentifier)` (unique index trên `SyncableEntity`). ID ổn định qua mọi workspace và mọi release là thứ cho diff biết "field này là cũ → update" vs "mới → create" → rename/đổi type migrate tại chỗ, không drop+recreate (mất data). PK `id` là UUID random per-workspace; `universalIdentifier` mới là identity xuyên workspace.

### 6.4. Standard objects định nghĩa bằng code

> **QUAN TRỌNG — khác mọi tutorial cũ:** `grep @WorkspaceEntity` = **0 match**. Decorator `@WorkspaceEntity`/`@WorkspaceField`/`@WorkspaceRelation` **đã bị bỏ**. Standard object giờ định nghĩa bằng **2 phần bổ sung nhau**:

**(a) Class TypeScript thuần — CHỈ để typing compile-time:**
```ts
// packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts
export class PersonWorkspaceEntity extends BaseWorkspaceEntity {
  name: FullNameMetadata | null;
  emails: EmailsMetadata;
  jobTitle: string | null;
  company: EntityRelation<CompanyWorkspaceEntity> | null;
  companyId: string | null;
  searchVector: string;
}
```
Chỉ dùng trong `src/modules/` làm type generic cho `WorkspaceRepository<PersonWorkspaceEntity>` (service, listener). **Không** drive schema generation — `PersonWorkspaceEntity` không xuất hiện ở `src/engine/`.

**(b) "Flat metadata" builder — định nghĩa runtime thật (thay `@WorkspaceField`):**
```ts
// engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-person-standard-flat-field-metadata.util.ts
export const buildPersonStandardFlatFieldMetadatas = ({ now, objectName, workspaceId, ... }) => ({
  id:       createStandardFieldFlatMetadata({ context:{ fieldName:'id', type: FieldMetadataType.UUID, isSystem:true, isNullable:false, defaultValue:'uuid' }, ... }),
  name:     createStandardFieldFlatMetadata({ context:{ fieldName:'name', type: FieldMetadataType.FULL_NAME, label:i18nLabel(msg`Name`), icon:'IconUser', isNullable:true }, ... }),
  emails:   createStandardFieldFlatMetadata({ context:{ fieldName:'emails', type: FieldMetadataType.EMAILS, isUnique:true, settings:{ maxNumberOfValues:1 } }, ... }),
  jobTitle: createStandardFieldFlatMetadata({ context:{ fieldName:'jobTitle', type: FieldMetadataType.TEXT, icon:'IconBriefcase', isNullable:true }, ... }),
  // Relation dùng builder riêng:
  company:  createStandardRelationFieldFlatMetadata({ context:{ type: FieldMetadataType.RELATION, fieldName:'company',
              targetObjectName:'company', targetFieldName:'people',
              settings:{ relationType: RelationType.MANY_TO_ONE, onDelete: RelationOnDeleteAction.SET_NULL, joinColumnName:'companyId' } }, ... }),
  searchVector: createStandardFieldFlatMetadata({ context:{ fieldName:'searchVector', type: FieldMetadataType.TS_VECTOR, isSystem:true }, ... }),
});
```
Object-level builder (thay `@WorkspaceEntity`): `utils/object-metadata/create-standard-object-flat-metadata.util.ts` → `createStandardObjectFlatMetadata(...)` trả `FlatObjectMetadata` (nameSingular, labels, icon, `labelIdentifierFieldMetadataName`, `universalIdentifier`...).

Key field-name trong builder khớp đúng property của `PersonWorkspaceEntity`. Label dùng i18n macro `i18nLabel(msg\`...\`)`.

### 6.5. GraphQL API generation

3 scope resolver: `'core' | 'metadata' | 'admin'`.

**Metadata API (`/metadata`):** resolver NestJS viết tay CRUD trên metadata: `object-metadata.resolver.ts`, `field-metadata.resolver.ts`... Đây là API admin UI dùng để tạo custom object/field.

**Core workspace-data API (`/graphql`):** schema **auto-generated per-workspace từ metadata**:
```ts
// engine/api/graphql/workspace-schema.factory.ts
async createGraphQLSchema(workspace, applicationId?) {
  const { sdl, ... } = await this.workspaceGraphqlSchemaSDLService.getOrComputeSchemaSDL(workspace, applicationId); // cache theo metadata version
  const autoGeneratedResolvers = await this.workspaceResolverFactory.create(flatObjectMetadataMaps, ...);
  return makeExecutableSchema({ typeDefs: gql`${sdl}`, resolvers: { ...scalarsResolvers, ...autoGeneratedResolvers } });
}
```
- SDL cache theo **metadata version** (chỉ recompute khi metadata đổi).
- Resolver từ `workspace-resolver-builder/workspace-resolver.factory.ts` — 1 factory / operation: `find-many`, `find-one`, `create-one/many`, `update-one/many`, `delete-one`, `destroy-*`, `restore-*`, `merge-many`, `group-by`, `find-duplicates`. Mỗi object có full CRUD sinh sẵn.
- Execution qua `graphql-query-runner/` → twenty-orm → workspace schema.

### 6.6. Workspace sync & migration engine

**Sync flow** (tương đương `workspaceSyncMetadata` cũ) — chạy khi tạo workspace (`workspace-manager.service.ts`):
```ts
const schemaName = await this.workspaceDataSourceService.createWorkspaceDBSchema(workspaceId); // CREATE SCHEMA workspace_xxx
await this.applicationService.createTwentyStandardApplication({ workspaceId });                  // đăng ký "app" built-in
await this.twentyStandardApplicationService.synchronizeTwentyStandardApplicationOrThrow({ workspaceId });
await this.setupDefaultRoles({...});
```

Standard object được model như 1 **application** built-in ("twenty-standard-application"). Sync service (`twenty-standard-application/services/twenty-standard-application.service.ts`):
```ts
async synchronizeTwentyStandardApplicationOrThrow({ workspaceId }) {
  // FROM = metadata DB hiện tại (cache)   TO = trạng thái code-defined (từ STANDARD_OBJECTS + compute-*-flat utils)
  const { allFlatEntityMaps: to, ... } = computeTwentyStandardApplicationAllFlatEntityMaps({ now, workspaceId, twentyStandardApplicationId });
  await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo({
    buildOptions: { isSystemBuild: true, inferDeletionFromMissingEntities: true, applicationUniversalIdentifier },
    fromToAllFlatEntityMaps, workspaceId, ...
  });
}
```
`computeTwentyStandardApplicationAllFlatEntityMaps` (master assembler) gọi mọi `build-standard-flat-*-metadata-maps.util.ts` (objects, fields, indexes, views, roles, page-layouts...).

**Migration engine** (`workspace-migration/`):
- `workspace-migration-validate-build-and-run-service.ts` — orchestrate **validate → build → run**, expand side-effect, emit event, hỗ trợ `dryRun`.
- `workspace-migration-builder/` — diff "from" vs "to", emit **action** typed (`create`/`update`/`delete` per metadata type).
- `workspace-migration-runner/` — chạy action qua **action-handler** (object/field/view/index/role), mỗi handler có `executeForMetadata` (ghi `core.*`) + `executeForWorkspaceSchema` (DDL).

**Upgrade cho workspace đã tồn tại (staging/prod):** dùng "instance/upgrade command" ở `src/database/commands/upgrade-version-command/<version>/`, **KHÔNG dùng TypeORM migration** (TypeORM migration system bị đóng băng — xem `legacy-typeorm-migrations-do-not-add/`, `docs/UPGRADE_COMMANDS.md`).

**twenty-orm layer:** `WorkspaceRepository<T> extends Repository<T>` (TypeORM) + `objectRecordsPermissions`, `authContext`, custom query builder — enforce row/field permission. Inject qua `@InjectWorkspaceScopedRepository(Entity)`. `global-workspace-datasource` quản lý `DataSource` per-workspace (target schema `workspace_<base36>`).

---

## 7. HAI cách mở rộng (quan trọng nhất)

### 7.A. Runtime custom object (no-code)

User tạo object trong **Settings > Data model** (hoặc gọi API) → hit **metadata GraphQL API** (`/metadata`):
- `object-metadata.resolver.ts` → mutation `createOneObject` / `updateOneObject` / `deleteOneObject`.
- → `object-metadata.service.ts` → ghi row vào `core.objectMetadata`/`fieldMetadata` + chạy workspace-migration tạo bảng `workspace_<hash>.<table>` vật lý.
- Object này có `isCustom: true`, thuộc **custom application** của workspace. **Không cần deploy/restart.** Cùng migration engine với standard object; khác chỗ metadata đến từ DB row thay vì code builder.

Dùng khi: tính năng chỉ cần thêm object/field, không cần logic backend riêng, và muốn user tự cấu hình.

### 7.B. Code-level standard object — PLAYBOOK

Dùng khi: muốn object là built-in cho MỌI workspace, hoặc cần logic backend (service, listener, job, integration) riêng.

Một standard object định nghĩa qua **3 tầng**. Ví dụ tham chiếu tốt để copy: object `note` hoặc `task` (đơn giản).

**Các file liên quan (theo object `note`):**

| Tầng | File | Vai trò |
|---|---|---|
| ID registry | `twenty-shared/src/metadata/constants/standard-object.constant.ts` | `STANDARD_OBJECTS.note`: UUID cho object + mọi field/index/view |
| Cross-ref ID | `twenty-shared/.../standard-object-universal-identifiers.constant.ts` | Object ID để object KHÁC tham chiếu qua relation |
| System fields | `twenty-shared/.../utils/internal/build-standard-object-system-fields.util.ts` | `buildStandardObjectSystemFields(uuid)` — derive 8 system field |
| Object builder | `twenty-server/.../twenty-standard-application/utils/object-metadata/create-standard-flat-object-metadata.util.ts` | Entry `note:` trong `STANDARD_FLAT_OBJECT_METADATA_BUILDERS_BY_OBJECT_NAME` |
| Field builder | `.../utils/field-metadata/compute-note-standard-flat-field-metadata.util.ts` | `buildNoteStandardFlatFieldMetadatas` — field defs thật |
| Field registry | `.../utils/field-metadata/build-standard-flat-field-metadata-maps.util.ts` | `note:` trong `STANDARD_FLAT_FIELD_METADATA_BUILDERS_BY_OBJECT_NAME` |
| Index | `.../utils/index/compute-note-standard-flat-index-metadata.util.ts` | Index builder (vd searchVector GIN) |
| Search config | `.../constants/search-fields-by-standard-object-name.constant.ts` | BẮT BUỘC nếu `isSearchable:true` |
| Page layout | `.../utils/page-layout-config/standard-note-page-layout.config.ts` (+ `index.ts`) | Layout tab/widget trang detail |
| Nav sidebar | `.../constants/standard-navigation-menu-item.constant.ts` | Entry sidebar trỏ view `allNotes` |
| Type shell | `twenty-server/src/modules/note/standard-objects/note.workspace-entity.ts` | Class typing (không decorator) |

**"Registration" giờ do TYPE SYSTEM enforce, không phải array runtime.** Có 2 map với `satisfies`:
- `STANDARD_FLAT_OBJECT_METADATA_BUILDERS_BY_OBJECT_NAME` ... `satisfies { [P in AllStandardObjectName]: (...) => FlatObjectMetadata }`
- `STANDARD_FLAT_FIELD_METADATA_BUILDERS_BY_OBJECT_NAME` ... `satisfies { [P in AllStandardObjectName]: StandardFieldBuilder<P> }`

Trong đó `AllStandardObjectName = keyof typeof STANDARD_OBJECTS`. **Ngay khi thêm key vào `STANDARD_OBJECTS`, TypeScript fail compile tới khi bạn thêm builder ở CẢ 2 map.** Thiếu = compile error, không phải skip im lặng.

**Các bước (thêm object `invoice`):**

1. Thêm `invoice:` vào `STANDARD_OBJECTS` (`twenty-shared`): object `universalIdentifier` (UUID mới) + `...buildStandardObjectSystemFields(<uuid đó>)` + ít nhất 1 label-identifier field (vd `title`, UUID riêng) + 1 view `allInvoices`.
2. Thêm builder `invoice:` vào `STANDARD_FLAT_OBJECT_METADATA_BUILDERS_BY_OBJECT_NAME` (context bắt buộc: `universalIdentifier, nameSingular, namePlural, labelSingular, labelPlural, description, icon, labelIdentifierFieldMetadataName`).
3. Tạo `compute-invoice-standard-flat-field-metadata.util.ts` (1 `createStandardFieldFlatMetadata` cho mỗi field khai báo ở bước 1, gồm cả 8 system field) và đăng ký vào `STANDARD_FLAT_FIELD_METADATA_BUILDERS_BY_OBJECT_NAME`.
4. Thêm index builder nếu cần.
5. Reset DB dev (object materialize tự động ở lần sync sau):
```bash
npx nx run twenty-server:database:reset
#   = truncate-db → database:init → cache:flush → workspace:seed:dev
# bản không seed demo:
npx nx run twenty-server:database:reset:no-seed
```
6. (Optional) nav item, page-layout config, seed data.
7. **Frontend: không cần gì.** Object tự có ở `/objects/invoices`, search, API.

**Roll ra workspace đã tồn tại (staging/prod):** tạo instance command rồi chạy:
```bash
npx nx run twenty-server:database:migrate:generate --name add-invoice-object --type fast
#   fast = schema diff | slow = data migration + DDL  (default fast)
npx nx run twenty-server:database:migrate
#   = run-instance-commands --force  (áp cho mọi workspace)
```
Ví dụ command thật sync object mới vào workspace cũ: `src/database/commands/upgrade-version-command/2-10/2-10-workspace-command-...-sync-call-recording-standard-objects.command.ts`.

**Seed data dev:** `src/engine/workspace-manager/dev-seeder/data/constants/<object>-data-seeds.constant.ts` (vd `note-data-seeds.constant.ts`). Wire vào `dev-seeder-data.service.ts` như `RecordSeedConfig`, đặt đúng **batch** theo thứ tự FK. Chạy qua `workspace:seed:dev`.

### 7.C. Gotchas khi thêm standard object

- **`universalIdentifier` immutable & unique.** Không bao giờ sửa UUID đã tồn tại. Mỗi field/index/view cần UUID mới. Trùng UUID trong toàn registry → throw lúc build (`addFlatEntityToFlatEntityMapsOrThrow`).
- **Không tự viết ID system field.** Derive deterministic qua `buildStandardObjectSystemFields`. Đổi tên system field âm thầm đổi ID và làm hỏng workspace cũ.
- **`labelIdentifierFieldMetadataName` bắt buộc** và phải trỏ field thật (drive title record khắp nơi). `imageIdentifierFieldMetadataName` optional (avatar).
- **Naming:** `nameSingular` camelCase, `namePlural` số nhiều; unique; KHÔNG trùng `RESERVED_METADATA_NAME_KEYWORDS` (`user(s)`, `workspace(s)`, `role(s)`, `pageLayout(s)`, `job(s)`, `billing*`...). Giới hạn độ dài `IDENTIFIER_MAX_CHAR_LENGTH`.
- **Relation: define CẢ 2 phía.** Owning side dùng `createStandardRelationFieldFlatMetadata` với `targetObjectName`/`targetFieldName`; object đích khai báo inverse field + index. ID relation cross-object lấy từ `STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS`.
- **`isSearchable:true` đi kèm** entry `SEARCH_FIELDS_BY_STANDARD_OBJECT_NAME` + field `searchVector` (TS_VECTOR) + GIN index, nếu không sync validation fail.
- **Label i18n:** bọc `i18nLabel(msg\`...\`)` → chạy `nx run twenty-server:lingui:extract`.
- **Icon:** tên Tabler icon dạng string (`'IconNotes'`), phải tồn tại trong icon set frontend.
- **GraphQL backward-compat:** thêm field an toàn; rename/xóa đổi API surface mọi workspace → cần upgrade command + migrate data (xem pattern `@deprecated` shim ở `person.phone`, `note.bodyV2` cạnh `body` legacy).

---

## 8. Quick reference: bản đồ file

**Design system**
- Theme runtime: `packages/twenty-ui/src/theme-constants/{theme-light.css, themeCssVariables.ts, ThemeProvider.tsx, useTheme.ts}`
- Token TS: `packages/twenty-ui/src/theme/constants/`
- App theme wiring: `packages/twenty-front/src/index.tsx`, `.../modules/ui/theme/components/BaseThemeProvider.tsx`
- Icon: `packages/twenty-ui/src/icon/{components/TablerIcons.ts, hooks/useIcons.ts, types/IconComponent.ts}`

**Frontend**
- State core: `packages/twenty-front/src/modules/ui/utilities/state/jotai/{utils,hooks}/`, `.../state/component-state/`
- Metadata→GraphQL: `.../object-record/utils/generateFindManyRecordsQuery.ts`, `.../object-metadata/utils/mapObjectMetadataToGraphQLQuery.ts`
- Record data hook: `.../object-record/hooks/useFindManyRecords.ts` (+ siblings)
- Metadata access: `.../object-metadata/hooks/useObjectMetadataItem.ts`, `.../metadata-store/`
- Routing: `.../modules/app/hooks/useCreateWorkspaceAppRouter.tsx`, `.../app/components/SettingsRoutes.tsx`, `packages/twenty-shared/src/types/AppPath.ts`
- Record UI: `.../pages/object-record/{RecordIndexPage,RecordShowPage}.tsx`, `.../record-table/components/RecordTable.tsx`, `.../record-field/ui/components/FieldDisplay.tsx`

**Backend / metadata engine**
- Metadata table: `packages/twenty-server/src/engine/metadata-modules/{object-metadata,field-metadata}/*.entity.ts`; base `.../workspace-manager/types/syncable-entity.interface.ts`
- Schema per-workspace: `.../engine/workspace-datasource/utils/get-workspace-schema-name.util.ts`, `.../workspace-datasource.service.ts`
- Standard object def: `.../engine/workspace-manager/twenty-standard-application/` (`utils/object-metadata/`, `utils/field-metadata/compute-*.util.ts`); class shell `src/modules/**/standard-objects/*.workspace-entity.ts`
- ID registry: `packages/twenty-shared/src/metadata/constants/{standard-object.constant.ts, standard-object-universal-identifiers.constant.ts}`
- Sync + migration: `.../workspace-manager/{workspace-manager.service.ts, twenty-standard-application/services/twenty-standard-application.service.ts, workspace-migration/**}`
- twenty-orm: `.../engine/twenty-orm/{repository/workspace.repository.ts, workspace-schema-manager/**, global-workspace-datasource/**}`
- GraphQL gen: `.../engine/api/graphql/{workspace-schema.factory.ts, workspace-resolver-builder/**, metadata-graphql-api.module.ts}`
- Auth: `packages/twenty-server/src/app.module.ts`, `.../engine/middlewares/graphql-hydrate-request-from-token.middleware.ts`, `.../engine/guards/**`

**CLI hay dùng**
```bash
# reset DB dev (materialize object mới)
npx nx run twenty-server:database:reset
# tạo upgrade command cho workspace đã tồn tại
npx nx run twenty-server:database:migrate:generate --name <name> --type <fast|slow>
npx nx run twenty-server:database:migrate
# lint / typecheck sau khi đổi code
npx nx lint:diff-with-main twenty-server && npx nx typecheck twenty-server
# GraphQL types sau khi đổi schema
npx nx run twenty-front:graphql:generate
```

---

## Phụ lục: khác biệt với tài liệu Twenty online

Bản này (~2.23) đã bỏ so với các version cũ mà docs/tutorial trên mạng mô tả:

| Cũ (docs online) | Bản này |
|---|---|
| `@WorkspaceEntity` / `@WorkspaceField` / `@WorkspaceRelation` decorator | Class typing thuần + flat-metadata builder function |
| `STANDARD_OBJECT_IDS` / `STANDARD_FIELD_IDS` (numeric) | `universalIdentifier` UUID deterministic trong `twenty-shared` |
| Schema `metadata` + `core` riêng | Chỉ 1 schema `core` chung cho toàn bộ metadata |
| Đăng ký object qua array `standard-objects/index.ts` | 2 map `satisfies`-typed, enforce bởi TypeScript |
| TypeORM migration | Instance/upgrade command (`upgrade-version-command/`) |

Khi tra cứu, ưu tiên đọc code thật trong repo (dùng `codegraph explore "..."`) thay vì docs online.
