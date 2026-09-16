/**
 * Kōvara AI Design System
 * Agentic Infrastructure for finance and insurance.
 *
 * Import the stylesheet once at your app root:
 *   import '@kovara/design-system/styles.css';
 * then wrap the tree in <KovaraProvider>.
 */

// Foundations
export { KovaraProvider, useKovaraTheme } from './components/KovaraProvider';
export type { KovaraProviderProps, KovaraTheme } from './components/KovaraProvider';
export { Icon } from './components/Icon';
export type { IconProps, IconName } from './components/Icon';

// Brand
export { BrandMark } from './components/BrandMark';
export type { BrandMarkProps, BrandMarkTone } from './components/BrandMark';
export { Logo, KOVARA_TAGLINE } from './components/Logo';
export type { LogoProps, LogoSize, LogoVariant } from './components/Logo';

// Actions
export { Button } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button';
export { IconButton } from './components/IconButton';
export type { IconButtonProps, IconButtonVariant } from './components/IconButton';
export { ButtonGroup } from './components/ButtonGroup';
export type { ButtonGroupProps } from './components/ButtonGroup';
export { Spinner } from './components/Spinner';
export type { SpinnerProps } from './components/Spinner';

// Forms
export { FormField } from './components/FormField';
export type { FormFieldProps } from './components/FormField';
export { TextField } from './components/TextField';
export type { TextFieldProps } from './components/TextField';
export { Textarea } from './components/Textarea';
export type { TextareaProps } from './components/Textarea';
export { Select } from './components/Select';
export type { SelectProps, SelectOption } from './components/Select';
export { SearchInput } from './components/SearchInput';
export type { SearchInputProps } from './components/SearchInput';
export { Checkbox } from './components/Checkbox';
export type { CheckboxProps } from './components/Checkbox';
export { Radio } from './components/Radio';
export type { RadioProps } from './components/Radio';
export { RadioGroup } from './components/RadioGroup';
export type { RadioGroupProps } from './components/RadioGroup';
export { Switch } from './components/Switch';
export type { SwitchProps } from './components/Switch';

// Data display
export { Card } from './components/Card';
export type { CardProps, CardVariant } from './components/Card';
export { StatCard } from './components/StatCard';
export type { StatCardProps, StatTrend } from './components/StatCard';
export { DataTable } from './components/DataTable';
export type { DataTableProps, DataTableColumn } from './components/DataTable';
export { Badge } from './components/Badge';
export type { BadgeProps, BadgeTone } from './components/Badge';
export { StatusPill } from './components/StatusPill';
export type { StatusPillProps, StatusValue } from './components/StatusPill';
export { Avatar } from './components/Avatar';
export type { AvatarProps, AvatarSize, AvatarTone } from './components/Avatar';
export { AvatarGroup } from './components/AvatarGroup';
export type { AvatarGroupProps } from './components/AvatarGroup';
export { DescriptionList } from './components/DescriptionList';
export type { DescriptionListProps, DescriptionItem } from './components/DescriptionList';
export { Progress } from './components/Progress';
export type { ProgressProps, ProgressTone } from './components/Progress';
export { Skeleton } from './components/Skeleton';
export type { SkeletonProps } from './components/Skeleton';

// Feedback
export { Alert } from './components/Alert';
export type { AlertProps, AlertTone } from './components/Alert';
export { Toast } from './components/Toast';
export type { ToastProps, ToastTone } from './components/Toast';
export { Tooltip } from './components/Tooltip';
export type { TooltipProps, TooltipPlacement } from './components/Tooltip';
export { EmptyState } from './components/EmptyState';
export type { EmptyStateProps } from './components/EmptyState';

// Navigation
export { Sidebar } from './components/Sidebar';
export type { SidebarProps, SidebarItem, SidebarSection } from './components/Sidebar';
export { TopBar } from './components/TopBar';
export type { TopBarProps } from './components/TopBar';
export { Tabs } from './components/Tabs';
export type { TabsProps, TabItem } from './components/Tabs';
export { Breadcrumbs } from './components/Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbItem } from './components/Breadcrumbs';
export { Pagination } from './components/Pagination';
export type { PaginationProps } from './components/Pagination';
export { Menu } from './components/Menu';
export type { MenuProps, MenuItem, MenuGroup } from './components/Menu';
export { PageHeader } from './components/PageHeader';
export type { PageHeaderProps } from './components/PageHeader';

// Overlay
export { Modal } from './components/Modal';
export type { ModalProps } from './components/Modal';
export { Drawer } from './components/Drawer';
export type { DrawerProps } from './components/Drawer';

// Platform — the Kōvara domain layer
export { QuoteCard } from './components/QuoteCard';
export type { QuoteCardProps } from './components/QuoteCard';
export { PolicyRow } from './components/PolicyRow';
export type { PolicyRowProps } from './components/PolicyRow';
export { ClaimTimeline } from './components/ClaimTimeline';
export type { ClaimTimelineProps, TimelineEvent, TimelineState } from './components/ClaimTimeline';
export { WorkflowRunCard } from './components/WorkflowRunCard';
export type { WorkflowRunCardProps, RunState } from './components/WorkflowRunCard';
export { CallSummaryCard } from './components/CallSummaryCard';
export type { CallSummaryCardProps, CallDirection, CallOutcome } from './components/CallSummaryCard';
export { IntegrationTile } from './components/IntegrationTile';
export type { IntegrationTileProps } from './components/IntegrationTile';
export { OnboardingSteps } from './components/OnboardingSteps';
export type { OnboardingStepsProps, OnboardingStep, OnboardingStepState } from './components/OnboardingSteps';

// Developer — the platform surfaces: APIs, embeds, keys, webhook activity
export { CodeBlock } from './components/CodeBlock';
export type { CodeBlockProps } from './components/CodeBlock';
export { EndpointRow } from './components/EndpointRow';
export type { EndpointRowProps, HttpMethod } from './components/EndpointRow';
export { ApiKeyField } from './components/ApiKeyField';
export type { ApiKeyFieldProps } from './components/ApiKeyField';
export { WebhookEventRow } from './components/WebhookEventRow';
export type { WebhookEventRowProps, DeliveryState } from './components/WebhookEventRow';

// Marketing — the surfaces the public site is built from
export { Eyebrow } from './components/Eyebrow';
export type { EyebrowProps } from './components/Eyebrow';
export { ProductCard } from './components/ProductCard';
export type { ProductCardProps } from './components/ProductCard';
