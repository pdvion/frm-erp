-- CreateEnum
CREATE TYPE "api_key_permission" AS ENUM ('PRODUCTS_READ', 'PRODUCTS_WRITE', 'CUSTOMERS_READ', 'CUSTOMERS_WRITE', 'ORDERS_READ', 'ORDERS_WRITE', 'INVOICES_READ', 'STOCK_READ', 'PURCHASE_ORDERS_READ', 'PURCHASE_ORDERS_WRITE', 'SUPPLIERS_READ', 'SUPPLIERS_WRITE', 'ALL');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('ENTRY', 'EXIT', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "InventoryType" AS ENUM ('RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED', 'CRITICAL', 'DEAD', 'SCRAP');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'PENDING', 'SENT', 'RECEIVED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayableStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayableType" AS ENUM ('INVOICE', 'SERVICE', 'TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "PermissionLevel" AS ENUM ('NONE', 'VIEW', 'EDIT', 'FULL');

-- CreateEnum
CREATE TYPE "SystemModule" AS ENUM ('MATERIALS', 'SUPPLIERS', 'QUOTES', 'RECEIVING', 'MATERIAL_OUT', 'INVENTORY', 'REPORTS', 'SETTINGS');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'SENT', 'PARTIAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'IN_SEPARATION', 'PARTIAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequisitionType" AS ENUM ('PRODUCTION', 'MAINTENANCE', 'ADMINISTRATIVE', 'PROJECT', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'INVESTMENT', 'CASH');

-- CreateEnum
CREATE TYPE "ReceivableStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "ReceivableType" AS ENUM ('INVOICE', 'SERVICE', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BankTransactionType" AS ENUM ('CREDIT', 'DEBIT', 'TRANSFER_IN', 'TRANSFER_OUT', 'FEE', 'INTEREST', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "MrpSuggestionType" AS ENUM ('PRODUCTION', 'PURCHASE', 'RESCHEDULE', 'CANCEL');

-- CreateEnum
CREATE TYPE "MrpSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "StopType" AS ENUM ('PLANNED', 'UNPLANNED', 'SETUP', 'MAINTENANCE', 'QUALITY', 'MATERIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'REFERRAL', 'COLD_CALL', 'TRADE_SHOW', 'SOCIAL_MEDIA', 'EMAIL', 'OTHER');

-- CreateEnum
CREATE TYPE "SalesQuoteStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('DRAFT', 'PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'PRODUCTION', 'QUALITY', 'SHIPPING', 'RECEIVING', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CLT', 'PJ', 'TEMPORARY', 'INTERN', 'APPRENTICE');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'VACATION', 'LEAVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "TimeClockType" AS ENUM ('CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END');

-- CreateEnum
CREATE TYPE "PayrollEventType" AS ENUM ('SALARY', 'OVERTIME', 'BONUS', 'COMMISSION', 'ALLOWANCE', 'DEDUCTION', 'TAX', 'BENEFIT');

-- CreateEnum
CREATE TYPE "WorkScheduleType" AS ENUM ('FIXED', 'ROTATING', 'FLEXIBLE', 'SHIFT');

-- CreateEnum
CREATE TYPE "HoursBankType" AS ENUM ('CREDIT', 'DEBIT', 'COMPENSATION', 'EXPIRATION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TimeClockAdjustmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VacationStatus" AS ENUM ('SCHEDULED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ThirteenthType" AS ENUM ('FIRST_INSTALLMENT', 'SECOND_INSTALLMENT', 'FULL', 'PROPORTIONAL');

-- CreateEnum
CREATE TYPE "ThirteenthStatus" AS ENUM ('PENDING', 'CALCULATED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TerminationType" AS ENUM ('RESIGNATION', 'DISMISSAL_WITH_CAUSE', 'DISMISSAL_NO_CAUSE', 'MUTUAL_AGREEMENT', 'CONTRACT_END', 'RETIREMENT', 'DEATH');

-- CreateEnum
CREATE TYPE "TerminationStatus" AS ENUM ('DRAFT', 'CALCULATED', 'APPROVED', 'PAID', 'HOMOLOGATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReceivingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'PARTIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReceivingItemStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "task_priority" AS ENUM ('URGENT', 'HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "task_entity_type" AS ENUM ('NFE', 'REQUISITION', 'PURCHASE_ORDER', 'QUOTE', 'PAYABLE', 'RECEIVABLE', 'PRODUCTION_ORDER', 'ADMISSION', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkflowCategory" AS ENUM ('APPROVAL', 'PROCESS', 'NOTIFICATION', 'INTEGRATION');

-- CreateEnum
CREATE TYPE "WorkflowTriggerType" AS ENUM ('MANUAL', 'AUTOMATIC', 'SCHEDULED', 'EVENT');

-- CreateEnum
CREATE TYPE "WorkflowStepType" AS ENUM ('START', 'APPROVAL', 'TASK', 'DECISION', 'NOTIFICATION', 'END', 'USER_TASK', 'SERVICE_TASK', 'SCRIPT_TASK', 'GATEWAY_EXCLUSIVE', 'GATEWAY_PARALLEL', 'GATEWAY_INCLUSIVE', 'SUBPROCESS', 'TIMER_EVENT', 'MESSAGE_EVENT', 'SIGNAL_EVENT');

-- CreateEnum
CREATE TYPE "WorkflowAssigneeType" AS ENUM ('USER', 'ROLE', 'DEPARTMENT', 'DYNAMIC');

-- CreateEnum
CREATE TYPE "WorkflowInstanceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkflowStepAction" AS ENUM ('APPROVED', 'REJECTED', 'COMPLETED', 'DELEGATED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "sefaz_manifestacao" AS ENUM ('CIENCIA', 'CONFIRMACAO', 'DESCONHECIMENTO', 'NAO_REALIZADA');

-- CreateEnum
CREATE TYPE "SupplierReturnStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'INVOICED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('QUALITY_ISSUE', 'WRONG_PRODUCT', 'WRONG_QUANTITY', 'DAMAGED', 'EXPIRED', 'NOT_ORDERED', 'PRICE_DIFFERENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "GedDocumentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "GedEntityType" AS ENUM ('SUPPLIER', 'CUSTOMER', 'EMPLOYEE', 'CONTRACT', 'PURCHASE_ORDER', 'SALES_ORDER', 'INVOICE', 'MATERIAL', 'PROJECT', 'GENERAL');

-- CreateEnum
CREATE TYPE "port_type" AS ENUM ('MARITIME', 'AIRPORT', 'BORDER');

-- CreateEnum
CREATE TYPE "import_status" AS ENUM ('DRAFT', 'PENDING_SHIPMENT', 'IN_TRANSIT', 'ARRIVED', 'IN_CLEARANCE', 'CLEARED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "exchange_status" AS ENUM ('OPEN', 'PARTIALLY_LIQUIDATED', 'LIQUIDATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('draft', 'active', 'inactive', 'discontinued');

-- CreateEnum
CREATE TYPE "product_video_type" AS ENUM ('training', 'demo', 'testimonial', 'unboxing', 'installation');

-- CreateEnum
CREATE TYPE "product_attachment_type" AS ENUM ('datasheet', 'manual', 'certificate', 'brochure', 'warranty');

-- CreateEnum
CREATE TYPE "collection_action_status" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'RESPONDED');

-- CreateEnum
CREATE TYPE "collection_action_type" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'PHONE', 'LETTER', 'NEGATIVATION', 'PROTEST');

-- CreateEnum
CREATE TYPE "contract_type" AS ENUM ('PURCHASE', 'FINANCIAL', 'PRESUMED');

-- CreateEnum
CREATE TYPE "freight_type" AS ENUM ('CIF', 'FOB', 'PICKUP');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('PENDING', 'VALIDATED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "operation_nature" AS ENUM ('INDUSTRIALIZATION', 'RESALE', 'CONSUMPTION', 'SERVICES', 'RAW_MATERIAL', 'SECONDARY', 'PACKAGING', 'FIXED_ASSET');

-- CreateEnum
CREATE TYPE "payable_contract_type" AS ENUM ('PURCHASE', 'FINANCIAL', 'PRESUMED');

-- CreateEnum
CREATE TYPE "production_delivery_type" AS ENUM ('ASSEMBLED', 'LOOSE');

-- CreateEnum
CREATE TYPE "production_execution_type" AS ENUM ('MANUFACTURE', 'ALTER');

-- CreateEnum
CREATE TYPE "production_request_type" AS ENUM ('SALES', 'STOCK', 'EXPORT', 'NORMAL', 'REWORK');

-- CreateEnum
CREATE TYPE "raw_material_origin" AS ENUM ('INDUSTRIALIZED_STOCK', 'RAW_MATERIAL', 'FOUNDRY');

-- CreateEnum
CREATE TYPE "supplier_certification_type" AS ENUM ('UNDEFINED', 'ISO_RBS', 'INITIAL_EVAL', 'STRATEGIC');

-- CreateEnum
CREATE TYPE "supplier_iqf_status" AS ENUM ('NEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DependentType" AS ENUM ('SPOUSE', 'CHILD', 'STEPCHILD', 'PARENT', 'LEGAL_GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('MEDICAL', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'MARRIAGE', 'MILITARY', 'JURY_DUTY', 'BLOOD_DONATION', 'UNION', 'OTHER');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'QUARANTINE', 'EXPIRED', 'CONSUMED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CategoryLevel" AS ENUM ('DOMAIN', 'TYPE', 'SUBFAMILY', 'SERIES');

-- CreateEnum
CREATE TYPE "AttributeDataType" AS ENUM ('FLOAT', 'INTEGER', 'STRING', 'BOOLEAN', 'ENUM');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'IMPROVEMENT');

-- CreateEnum
CREATE TYPE "MaintenanceOrderStatus" AS ENUM ('PLANNED', 'APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('EMERGENCY', 'URGENT', 'HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "MaintenanceFrequency" AS ENUM ('HOURS', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "EquipmentCriticality" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "FailureCategory" AS ENUM ('MECHANICAL', 'ELECTRICAL', 'HYDRAULIC', 'PNEUMATIC', 'ELECTRONIC', 'SOFTWARE', 'OTHER');

-- CreateEnum
CREATE TYPE "webhook_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "webhook_delivery_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "ESocialEnvironment" AS ENUM ('PRODUCTION', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "ESocialRubricType" AS ENUM ('EARNING', 'DEDUCTION', 'INFORMATIVE');

-- CreateEnum
CREATE TYPE "ESocialRubricIncidence" AS ENUM ('NORMAL', 'EXEMPT', 'SUSPENDED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ESocialBatchStatus" AS ENUM ('OPEN', 'VALIDATING', 'VALIDATED', 'SENDING', 'SENT', 'PROCESSING', 'PROCESSED', 'ERROR', 'CLOSED');

-- CreateEnum
CREATE TYPE "ESocialEventType" AS ENUM ('S_1000', 'S_1005', 'S_1010', 'S_1020', 'S_1070', 'S_2190', 'S_2200', 'S_2205', 'S_2206', 'S_2210', 'S_2220', 'S_2230', 'S_2231', 'S_2240', 'S_2298', 'S_2299', 'S_2300', 'S_2306', 'S_2399', 'S_2400', 'S_2405', 'S_2410', 'S_2416', 'S_2418', 'S_2420', 'S_1200', 'S_1202', 'S_1207', 'S_1210', 'S_1260', 'S_1270', 'S_1280', 'S_1298', 'S_1299', 'S_3000', 'S_3500', 'S_5001', 'S_5002', 'S_5003', 'S_5011', 'S_5012', 'S_5013');

-- CreateEnum
CREATE TYPE "ESocialEventStatus" AS ENUM ('DRAFT', 'VALIDATED', 'QUEUED', 'SENT', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXCLUDED');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT,
    "ie" TEXT,
    "address" TEXT,
    "addressNumber" TEXT,
    "addressComplement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_onboarding" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "steps_completed" JSONB NOT NULL DEFAULT '{}',
    "step1_data" JSONB,
    "step2_data" JSONB,
    "step3_data" JSONB,
    "step4_data" JSONB,
    "step5_data" JSONB,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" INTEGER,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_company_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "module" "SystemModule" NOT NULL,
    "permission" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "canShare" BOOLEAN NOT NULL DEFAULT false,
    "canClone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_company_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "companyId" UUID,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_group_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "addedBy" UUID,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "key_hash" VARCHAR(64) NOT NULL,
    "key_prefix" VARCHAR(12) NOT NULL,
    "permissions" "api_key_permission"[] DEFAULT ARRAY['ALL']::"api_key_permission"[],
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "parent_id" UUID,
    "order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "level" "CategoryLevel",
    "norm_reference" TEXT,
    "technical_code" TEXT,
    "icon" TEXT,
    "company_id" UUID,
    "is_shared" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data_type" "AttributeDataType" NOT NULL DEFAULT 'STRING',
    "unit" TEXT,
    "enum_options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validation_regex" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" UUID,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attribute_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_attributes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "attribute_id" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "default_value" TEXT,
    "company_id" UUID,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" TEXT NOT NULL,
    "material_id" UUID,
    "name" TEXT NOT NULL,
    "short_description" TEXT,
    "description" TEXT,
    "specifications" JSONB,
    "slug" TEXT NOT NULL,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "list_price" DECIMAL(15,2),
    "sale_price" DECIMAL(15,2),
    "category_id" UUID,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "product_status" DEFAULT 'draft',
    "is_published" BOOLEAN DEFAULT false,
    "published_at" TIMESTAMPTZ(6),
    "featured_order" INTEGER,
    "company_id" UUID,
    "is_shared" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "alt" TEXT,
    "caption" TEXT,
    "order" INTEGER DEFAULT 0,
    "is_primary" BOOLEAN DEFAULT false,
    "width" INTEGER,
    "height" INTEGER,
    "size_bytes" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_videos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "product_video_type" DEFAULT 'demo',
    "duration" INTEGER,
    "order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "type" "product_attachment_type" DEFAULT 'datasheet',
    "order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ged_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" SERIAL NOT NULL,
    "companyId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "categoryId" UUID,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "entityType" "GedEntityType",
    "entityId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" UUID,
    "isLatestVersion" BOOLEAN NOT NULL DEFAULT true,
    "status" "GedDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "requiresSignature" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "signedBy" UUID,
    "signatureId" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "metadata" JSONB,

    CONSTRAINT "ged_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ged_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "parentId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ged_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ged_access_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "documentId" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ged_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esocial_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "environment" "ESocialEnvironment" NOT NULL DEFAULT 'RESTRICTED',
    "employer_type" INTEGER NOT NULL DEFAULT 1,
    "software_id" VARCHAR(50),
    "software_name" VARCHAR(100),
    "certificate_path" VARCHAR(500),
    "certificate_expiry" DATE,
    "auto_generate" BOOLEAN NOT NULL DEFAULT false,
    "auto_send" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esocial_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esocial_rubrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "type" "ESocialRubricType" NOT NULL,
    "incidence_inss" "ESocialRubricIncidence" NOT NULL DEFAULT 'NORMAL',
    "incidence_irrf" "ESocialRubricIncidence" NOT NULL DEFAULT 'NORMAL',
    "incidence_fgts" "ESocialRubricIncidence" NOT NULL DEFAULT 'NORMAL',
    "incidence_sindical" "ESocialRubricIncidence" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "nature_code" VARCHAR(10),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esocial_rubrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esocial_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "batch_number" INTEGER NOT NULL,
    "group_type" VARCHAR(20) NOT NULL,
    "status" "ESocialBatchStatus" NOT NULL DEFAULT 'OPEN',
    "environment" "ESocialEnvironment" NOT NULL DEFAULT 'RESTRICTED',
    "protocol_number" VARCHAR(50),
    "receipt_date" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "events_count" INTEGER NOT NULL DEFAULT 0,
    "accepted_count" INTEGER NOT NULL DEFAULT 0,
    "rejected_count" INTEGER NOT NULL DEFAULT 0,
    "xml_content" TEXT,
    "response_xml" TEXT,
    "error_message" TEXT,
    "sent_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esocial_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esocial_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "event_type" "ESocialEventType" NOT NULL,
    "status" "ESocialEventStatus" NOT NULL DEFAULT 'DRAFT',
    "sequence_number" INTEGER NOT NULL,
    "reference_year" INTEGER,
    "reference_month" INTEGER,
    "employee_id" UUID,
    "payroll_id" UUID,
    "batch_id" UUID,
    "source_entity_type" VARCHAR(50),
    "source_entity_id" UUID,
    "event_id" VARCHAR(50),
    "receipt_number" VARCHAR(50),
    "receipt_protocol" VARCHAR(100),
    "xml_content" TEXT,
    "response_xml" TEXT,
    "validation_errors" JSONB,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "excluded_by_event_id" UUID,
    "is_rectification" BOOLEAN NOT NULL DEFAULT false,
    "rectifies_event_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esocial_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" INTEGER,
    "name" TEXT NOT NULL,
    "parentId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "companyId" UUID,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_payable" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" INTEGER NOT NULL,
    "companyId" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "documentType" "PayableType" NOT NULL DEFAULT 'INVOICE',
    "documentNumber" VARCHAR(50),
    "documentId" UUID,
    "invoiceId" UUID,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalValue" DECIMAL(15,2) NOT NULL,
    "discountValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interestValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fineValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paidValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netValue" DECIMAL(15,2) NOT NULL,
    "status" "PayableStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "installmentNumber" INTEGER NOT NULL DEFAULT 1,
    "totalInstallments" INTEGER NOT NULL DEFAULT 1,
    "categoryId" UUID,
    "costCenterId" UUID,
    "notes" TEXT,
    "barcode" VARCHAR(100),
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "bankAccountId" UUID,
    "approvalStatus" "ApprovalStatus" DEFAULT 'PENDING',
    "scheduledPaymentDate" TIMESTAMP(3),
    "additional_info" TEXT,
    "has_withholding" BOOLEAN DEFAULT false,
    "withholding_ir" DECIMAL(15,2) DEFAULT 0,
    "withholding_iss" DECIMAL(15,2) DEFAULT 0,
    "withholding_inss" DECIMAL(15,2) DEFAULT 0,
    "withholding_pis" DECIMAL(15,2) DEFAULT 0,
    "withholding_cofins" DECIMAL(15,2) DEFAULT 0,
    "withholding_csll" DECIMAL(15,2) DEFAULT 0,
    "supplier_alpha_code" TEXT,
    "supplier_cnpj" TEXT,
    "supplier_ie" TEXT,
    "supplier_state_code" INTEGER,
    "cost_center_group" INTEGER,
    "cost_center_code" TEXT,
    "cost_center_notes" TEXT,
    "sector_confirmed_at" TIMESTAMPTZ(6),
    "sector_confirmed_by_id" TEXT,
    "physical_delivery_at" TIMESTAMPTZ(6),
    "physical_delivery_by_id" TEXT,
    "payment_released_at" TIMESTAMPTZ(6),
    "payment_released_by_id" TEXT,
    "payment_bank_id" TEXT,
    "pdf_file_name" TEXT,
    "contract_type" "payable_contract_type",

    CONSTRAINT "accounts_payable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payable_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payableId" UUID NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "discountValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interestValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fineValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentMethod" VARCHAR(50),
    "bankAccountId" UUID,
    "notes" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bankTransactionId" UUID,

    CONSTRAINT "payable_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" UUID,
    "companyId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "budget" DECIMAL(15,2) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bankCode" TEXT,
    "bankName" TEXT,
    "agency" TEXT,
    "agencyDigit" TEXT,
    "accountNumber" TEXT,
    "accountDigit" TEXT,
    "accountType" "BankAccountType" NOT NULL DEFAULT 'CHECKING',
    "companyId" UUID NOT NULL,
    "initialBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "creditLimit" DECIMAL(15,2) DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bankAccountId" UUID NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "type" "BankTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "balanceAfter" DECIMAL(15,2) NOT NULL,
    "documentNumber" TEXT,
    "payableId" UUID,
    "receivableId" UUID,
    "transferToAccountId" UUID,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledAt" TIMESTAMP(3),
    "reconciledBy" UUID,
    "externalId" TEXT,
    "notes" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pix_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transactionId" TEXT NOT NULL,
    "e2eId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PAYMENT',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "pixKeyType" TEXT NOT NULL,
    "pixKey" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "recipientName" TEXT NOT NULL,
    "recipientDocument" TEXT,
    "recipientBank" TEXT,
    "recipientAgency" TEXT,
    "recipientAccount" TEXT,
    "description" TEXT,
    "bankAccountId" UUID,
    "payableId" UUID,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "companyId" UUID NOT NULL,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pix_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_receivable" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" INTEGER NOT NULL,
    "companyId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "documentType" "ReceivableType" NOT NULL DEFAULT 'INVOICE',
    "documentNumber" TEXT,
    "documentId" UUID,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalValue" DECIMAL(15,2) NOT NULL,
    "discountValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interestValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fineValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paidValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netValue" DECIMAL(15,2) NOT NULL,
    "status" "ReceivableStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "installmentNumber" INTEGER NOT NULL DEFAULT 1,
    "totalInstallments" INTEGER NOT NULL DEFAULT 1,
    "categoryId" UUID,
    "costCenterId" UUID,
    "bankAccountId" UUID,
    "boletoNumber" TEXT,
    "boletoBarcode" TEXT,
    "boletoUrl" TEXT,
    "pixCode" TEXT,
    "notes" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "issuedInvoiceId" UUID,

    CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivable_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "receivableId" UUID NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "discountValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interestValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fineValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "bankAccountId" UUID,
    "bankTransactionId" UUID,
    "notes" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receivable_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payable_approvals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payableId" UUID NOT NULL,
    "approverId" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payable_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payable_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payableId" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "description" TEXT,
    "uploadedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payable_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payable_cost_allocations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payableId" UUID NOT NULL,
    "costCenterId" UUID NOT NULL,
    "percentage" DECIMAL(10,4) NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payable_cost_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_thresholds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "minValue" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "maxValue" DECIMAL(15,4),
    "requiredApprovers" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_threshold_approvers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "thresholdId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_threshold_approvers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(20) NOT NULL DEFAULT 'EXPENSE',
    "parentId" UUID,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'ORIGINAL',
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "versionId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "costCenterId" UUID,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_actuals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "costCenterId" UUID,
    "date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "documentType" VARCHAR(50),
    "documentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_actuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "costCenterId" UUID,
    "month" INTEGER NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "budgetAmount" DECIMAL(15,2) NOT NULL,
    "actualAmount" DECIMAL(15,2) NOT NULL,
    "variance" DECIMAL(15,2) NOT NULL,
    "variancePercent" DECIMAL(5,2) NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" UUID,
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_levels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "minValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "maxValue" DECIMAL(15,2),
    "requiresAllApprovers" BOOLEAN NOT NULL DEFAULT false,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_level_approvers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "levelId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "canApprove" BOOLEAN NOT NULL DEFAULT true,
    "canReject" BOOLEAN NOT NULL DEFAULT true,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_level_approvers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "payableId" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "currentLevelId" UUID,
    "requestedBy" UUID NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "justification" TEXT,
    "urgency" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_approvals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requestId" UUID NOT NULL,
    "levelId" UUID NOT NULL,
    "approverId" UUID NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "comments" TEXT,
    "delegatedTo" UUID,
    "actionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dda_boletos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "codigo_barras" VARCHAR(48),
    "linha_digitavel" VARCHAR(54),
    "nosso_numero" VARCHAR(20),
    "seu_numero" VARCHAR(20),
    "valor_original" DECIMAL(15,2) NOT NULL,
    "valor_desconto" DECIMAL(15,2) DEFAULT 0,
    "valor_juros" DECIMAL(15,2) DEFAULT 0,
    "valor_multa" DECIMAL(15,2) DEFAULT 0,
    "valor_final" DECIMAL(15,2) NOT NULL,
    "data_emissao" DATE,
    "data_vencimento" DATE NOT NULL,
    "data_limite_pagamento" DATE,
    "cedente_cnpj" VARCHAR(18),
    "cedente_nome" VARCHAR(200),
    "cedente_banco" VARCHAR(3),
    "cedente_agencia" VARCHAR(10),
    "cedente_conta" VARCHAR(20),
    "sacado_cnpj" VARCHAR(18),
    "sacado_nome" VARCHAR(200),
    "status" VARCHAR(20) DEFAULT 'PENDENTE',
    "origem" VARCHAR(20) DEFAULT 'DDA',
    "accounts_payable_id" UUID,
    "supplier_id" UUID,
    "aprovado_por" UUID,
    "aprovado_em" TIMESTAMP(6),
    "motivo_rejeicao" TEXT,
    "pago_em" TIMESTAMP(6),
    "comprovante_url" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "dda_boletos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dda_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "banco_codigo" VARCHAR(3) NOT NULL,
    "banco_nome" VARCHAR(100),
    "agencia" VARCHAR(10),
    "conta" VARCHAR(20),
    "convenio" VARCHAR(20),
    "ambiente" VARCHAR(10) DEFAULT 'HOMOLOGACAO',
    "client_id" TEXT,
    "client_secret" TEXT,
    "certificado_id" TEXT,
    "ativo" BOOLEAN DEFAULT true,
    "auto_aprovar_ate" DECIMAL(15,2) DEFAULT 0,
    "notificar_novos" BOOLEAN DEFAULT true,
    "email_notificacao" VARCHAR(200),
    "ultima_sincronizacao" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dda_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dda_sync_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "config_id" UUID,
    "tipo" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "boletos_encontrados" INTEGER DEFAULT 0,
    "boletos_novos" INTEGER DEFAULT 0,
    "boletos_atualizados" INTEGER DEFAULT 0,
    "erro_mensagem" TEXT,
    "iniciado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "finalizado_em" TIMESTAMP(6),

    CONSTRAINT "dda_sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_default" BOOLEAN DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_rule_steps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "collection_rule_id" UUID NOT NULL,
    "step_order" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "days_offset" INTEGER NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "template_subject" VARCHAR(255),
    "template_body" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_rule_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "receivable_id" UUID NOT NULL,
    "collection_rule_id" UUID,
    "step_id" UUID,
    "action_type" VARCHAR(50) NOT NULL,
    "action_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "contact_info" VARCHAR(255),
    "message_content" TEXT,
    "response_content" TEXT,
    "response_date" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "nature" VARCHAR(10) NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "parent_id" UUID,
    "is_analytical" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "reference_code" VARCHAR(20),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "document_type" VARCHAR(50),
    "document_id" UUID,
    "document_number" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "total_debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "reversal_of" UUID,
    "reversed_by" UUID,
    "notes" TEXT,
    "posted_by" UUID,
    "posted_at" TIMESTAMP(3),
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entry_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entry_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "cost_center_id" UUID,
    "description" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_entry_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "acquisition_date" DATE NOT NULL,
    "acquisition_value" DECIMAL(15,2) NOT NULL,
    "residual_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "useful_life_months" INTEGER NOT NULL,
    "depreciation_method" VARCHAR(30) NOT NULL DEFAULT 'STRAIGHT_LINE',
    "depreciation_rate" DECIMAL(8,4) NOT NULL,
    "accumulated_depr" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_book_value" DECIMAL(15,2) NOT NULL,
    "location" VARCHAR(255),
    "responsible_id" UUID,
    "cost_center_id" UUID,
    "supplier" VARCHAR(255),
    "invoice_number" VARCHAR(50),
    "serial_number" VARCHAR(100),
    "warranty_expiry" DATE,
    "disposal_date" DATE,
    "disposal_value" DECIMAL(15,2),
    "disposal_reason" TEXT,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixed_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_depreciations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asset_id" UUID NOT NULL,
    "period" DATE NOT NULL,
    "depreciation_value" DECIMAL(15,2) NOT NULL,
    "accumulated_value" DECIMAL(15,2) NOT NULL,
    "net_book_value" DECIMAL(15,2) NOT NULL,
    "rate" DECIMAL(8,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_depreciations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asset_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "date" DATE NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "from_location" VARCHAR(255),
    "to_location" VARCHAR(255),
    "from_cost_center_id" UUID,
    "to_cost_center_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "received_invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "accessKey" VARCHAR(44) NOT NULL,
    "invoiceNumber" INTEGER NOT NULL,
    "series" INTEGER NOT NULL DEFAULT 1,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "supplierId" UUID,
    "supplierCnpj" VARCHAR(18) NOT NULL,
    "supplierName" VARCHAR(255) NOT NULL,
    "totalProducts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalInvoice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "freightValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discountValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "icmsBase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "icmsValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ipiValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pisValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cofinsValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "purchaseOrderId" UUID,
    "receivedAt" TIMESTAMP(3),
    "receivedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" UUID,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" UUID,
    "rejectionReason" TEXT,
    "companyId" UUID NOT NULL,
    "xmlContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "icms_st_base" DECIMAL(15,2) DEFAULT 0,
    "icms_st_value" DECIMAL(15,2) DEFAULT 0,
    "insurance_value" DECIMAL(15,2) DEFAULT 0,
    "other_expenses" DECIMAL(15,2) DEFAULT 0,
    "icms_credit" DECIMAL(15,2) DEFAULT 0,
    "icms_st_credit" DECIMAL(15,2) DEFAULT 0,
    "icms_sn_credit" DECIMAL(15,2) DEFAULT 0,
    "ipi_credit" DECIMAL(15,2) DEFAULT 0,
    "pis_credit" DECIMAL(15,2) DEFAULT 0,
    "cofins_credit" DECIMAL(15,2) DEFAULT 0,
    "cost_center_group" INTEGER,
    "cost_center_confirmed_by_id" TEXT,
    "payment_condition_id" TEXT,
    "installments_calculated" BOOLEAN DEFAULT false,
    "payment_date" TIMESTAMPTZ(6),
    "additional_info" TEXT,
    "xml_supplier_id" TEXT,

    CONSTRAINT "received_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "received_invoice_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "itemNumber" INTEGER NOT NULL,
    "productCode" VARCHAR(60) NOT NULL,
    "productName" VARCHAR(255) NOT NULL,
    "ncm" VARCHAR(10),
    "cfop" INTEGER NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit" VARCHAR(10) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "icmsRate" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "icmsValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ipiRate" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "ipiValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "materialId" UUID,
    "purchaseOrderItemId" UUID,
    "matchStatus" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "divergenceType" VARCHAR(20),
    "divergenceNote" TEXT,
    "receivedQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "received_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issued_invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" INTEGER NOT NULL,
    "invoiceNumber" VARCHAR(20) NOT NULL,
    "series" VARCHAR(5) NOT NULL DEFAULT '1',
    "model" VARCHAR(5) NOT NULL DEFAULT '55',
    "accessKey" VARCHAR(50),
    "protocolNumber" VARCHAR(20),
    "companyId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "salesOrderId" UUID,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operationType" VARCHAR(20) NOT NULL DEFAULT 'SALE',
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discountValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "shippingValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "icmsBase" DECIMAL(15,2) DEFAULT 0,
    "icmsValue" DECIMAL(15,2) DEFAULT 0,
    "ipiValue" DECIMAL(15,2) DEFAULT 0,
    "pisValue" DECIMAL(15,2) DEFAULT 0,
    "cofinsValue" DECIMAL(15,2) DEFAULT 0,
    "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "xmlContent" TEXT,
    "authorizedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "correctionSeq" INTEGER DEFAULT 0,
    "lastCorrection" TEXT,
    "lastCorrectionAt" TIMESTAMP(3),
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "issued_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issued_invoice_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit" VARCHAR(10) NOT NULL DEFAULT 'UN',
    "unitPrice" DECIMAL(15,4) NOT NULL,
    "discountPercent" DECIMAL(5,2) DEFAULT 0,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "cfop" VARCHAR(10),
    "ncm" VARCHAR(20),
    "icmsBase" DECIMAL(15,2) DEFAULT 0,
    "icmsRate" DECIMAL(5,2) DEFAULT 0,
    "icmsValue" DECIMAL(15,2) DEFAULT 0,
    "ipiBase" DECIMAL(15,2) DEFAULT 0,
    "ipiRate" DECIMAL(5,2) DEFAULT 0,
    "ipiValue" DECIMAL(15,2) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issued_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sefaz_sync_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "syncInterval" INTEGER NOT NULL DEFAULT 60,
    "lastSyncAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3),
    "autoManifest" BOOLEAN NOT NULL DEFAULT false,
    "manifestType" VARCHAR(20) DEFAULT 'CIENCIA',
    "notifyOnNewNfe" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sefaz_sync_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sefaz_sync_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "syncType" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "nfesFound" INTEGER DEFAULT 0,
    "nfesImported" INTEGER DEFAULT 0,
    "nfesSkipped" INTEGER DEFAULT 0,
    "nfesError" INTEGER DEFAULT 0,
    "errorMessage" TEXT,
    "details" JSONB DEFAULT '{}',

    CONSTRAINT "sefaz_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sefaz_pending_nfes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "chaveAcesso" VARCHAR(44) NOT NULL,
    "cnpjEmitente" VARCHAR(14) NOT NULL,
    "nomeEmitente" VARCHAR(255),
    "dataEmissao" DATE,
    "valorTotal" DECIMAL(15,2),
    "situacao" VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    "manifestacao" VARCHAR(20),
    "manifestadaEm" TIMESTAMP(3),
    "xmlContent" TEXT,
    "errorMessage" TEXT,
    "receivedInvoiceId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sefaz_pending_nfes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sefaz_manifestacao_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "chaveAcesso" VARCHAR(44) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "justificativa" VARCHAR(255),
    "protocolo" VARCHAR(50),
    "dataManifestacao" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL,
    "errorMessage" TEXT,
    "pendingNfeId" UUID,
    "userId" UUID,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sefaz_manifestacao_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "import_process_id" UUID NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "document_number" VARCHAR(100),
    "issue_date" DATE,
    "file_name" VARCHAR(255),
    "file_path" VARCHAR(500),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfe_queue_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nfe_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "next_retry_at" TIMESTAMPTZ(6),
    "message_id" BIGINT,

    CONSTRAINT "nfe_queue_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_regimes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_regimes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_obligations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMP(3),
    "receipt_number" VARCHAR(50),
    "receipt_protocol" VARCHAR(100),
    "is_rectification" BOOLEAN NOT NULL DEFAULT false,
    "rectification_of" UUID,
    "notes" TEXT,
    "responsible_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_apurations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "tax_type" VARCHAR(20) NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "credit_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "debit_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "previous_credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amount_due" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_at" TIMESTAMP(3),
    "paid_value" DECIMAL(15,2),
    "dare_number" VARCHAR(50),
    "notes" TEXT,
    "calculated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_apurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_apuration_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apuration_id" UUID NOT NULL,
    "document_type" VARCHAR(30) NOT NULL,
    "document_id" UUID,
    "document_number" VARCHAR(50),
    "cfop" VARCHAR(10),
    "base_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "tax_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "nature" VARCHAR(10) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_apuration_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfse_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "provider_code" VARCHAR(30) NOT NULL,
    "municipality_code" VARCHAR(10) NOT NULL,
    "environment" VARCHAR(20) NOT NULL DEFAULT 'HOMOLOGATION',
    "certificate_path" VARCHAR(500),
    "login" VARCHAR(100),
    "password" VARCHAR(255),
    "token" VARCHAR(500),
    "cnae" VARCHAR(10),
    "service_code" VARCHAR(20),
    "iss_rate" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nfse_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfse_issued" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" INTEGER NOT NULL,
    "customer_id" UUID NOT NULL,
    "service_code" VARCHAR(20) NOT NULL,
    "cnae" VARCHAR(10),
    "description" TEXT NOT NULL,
    "competence_date" DATE NOT NULL,
    "issue_date" TIMESTAMP(3),
    "service_value" DECIMAL(15,2) NOT NULL,
    "deduction_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "base_value" DECIMAL(15,2) NOT NULL,
    "iss_rate" DECIMAL(5,2) NOT NULL,
    "iss_value" DECIMAL(15,2) NOT NULL,
    "iss_withheld" BOOLEAN NOT NULL DEFAULT false,
    "pis_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cofins_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ir_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "csll_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "inss_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_value" DECIMAL(15,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "nfse_number" VARCHAR(30),
    "verification_code" VARCHAR(50),
    "xml_content" TEXT,
    "pdf_url" VARCHAR(500),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nfse_issued_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "difal_calculations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "document_type" VARCHAR(20) NOT NULL,
    "document_id" UUID,
    "document_number" VARCHAR(50),
    "uf_origem" VARCHAR(2) NOT NULL,
    "uf_destino" VARCHAR(2) NOT NULL,
    "product_value" DECIMAL(15,2) NOT NULL,
    "icms_origem_rate" DECIMAL(5,2) NOT NULL,
    "icms_destino_rate" DECIMAL(5,2) NOT NULL,
    "icms_inter_rate" DECIMAL(5,2) NOT NULL,
    "fcp" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "difal_value" DECIMAL(15,2) NOT NULL,
    "difal_origem" DECIMAL(15,2) NOT NULL,
    "difal_destino" DECIMAL(15,2) NOT NULL,
    "icms_st_base" DECIMAL(15,2),
    "icms_st_mva" DECIMAL(7,4),
    "icms_st_value" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "difal_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloco_k_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "record_type" VARCHAR(10) NOT NULL,
    "material_id" UUID,
    "quantity" DECIMAL(15,4),
    "production_order_id" UUID,
    "movement_date" DATE,
    "movement_type" VARCHAR(20),
    "origin_document" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloco_k_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "targetValue" DECIMAL(15,2),
    "unit" VARCHAR(20),
    "weight" DECIMAL(5,2) DEFAULT 1.0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "ownerId" UUID,
    "departmentId" UUID,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategic_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_indicators" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "goalId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "formula" TEXT,
    "unit" VARCHAR(20),
    "polarity" VARCHAR(10) NOT NULL DEFAULT 'HIGHER',
    "frequency" VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    "targetMin" DECIMAL(15,2),
    "targetExpected" DECIMAL(15,2),
    "targetMax" DECIMAL(15,2),
    "currentValue" DECIMAL(15,2),
    "lastUpdated" TIMESTAMP(3),
    "dataSource" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicator_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "indicatorId" UUID NOT NULL,
    "period" DATE NOT NULL,
    "value" DECIMAL(15,4) NOT NULL,
    "target" DECIMAL(15,4),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ON_TARGET',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicator_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "goalId" UUID,
    "indicatorId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(20) NOT NULL DEFAULT 'CORRECTIVE',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "responsibleId" UUID,
    "dueDate" DATE,
    "completedAt" TIMESTAMP(3),
    "progress" INTEGER DEFAULT 0,
    "rootCause" TEXT,
    "expectedResult" TEXT,
    "actualResult" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_plan_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actionPlanId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "responsibleId" UUID,
    "dueDate" DATE,
    "completedAt" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "sequence" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_plan_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "managerId" UUID,
    "parentId" UUID,
    "companyId" UUID NOT NULL,
    "costCenterId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_positions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" UUID,
    "companyId" UUID NOT NULL,
    "baseSalary" DECIMAL(15,2),
    "level" INTEGER DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" INTEGER NOT NULL,
    "companyId" UUID NOT NULL,
    "userId" UUID,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "birthDate" DATE,
    "gender" TEXT,
    "maritalStatus" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "address" TEXT,
    "addressNumber" TEXT,
    "addressComplement" TEXT,
    "addressNeighborhood" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZipCode" TEXT,
    "departmentId" UUID,
    "positionId" UUID,
    "managerId" UUID,
    "contractType" "ContractType" NOT NULL DEFAULT 'CLT',
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "hireDate" DATE NOT NULL,
    "terminationDate" DATE,
    "salary" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "workHoursPerDay" DECIMAL(15,4) NOT NULL DEFAULT 8,
    "workDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "bankName" TEXT,
    "bankBranch" TEXT,
    "bankAccount" TEXT,
    "bankAccountType" TEXT,
    "pixKey" TEXT,
    "pis" TEXT,
    "ctps" TEXT,
    "voterRegistration" TEXT,
    "militaryService" TEXT,
    "notes" TEXT,
    "photo" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "insalubrity_degree" TEXT,
    "has_dangerousness" BOOLEAN DEFAULT false,
    "dependents_count" INTEGER DEFAULT 0,
    "bank_code" TEXT,
    "bank_agency" TEXT,
    "bank_account_digit" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_clock_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL,
    "type" "TimeClockType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "deviceId" TEXT,
    "ipAddress" TEXT,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "justification" TEXT,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_clock_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheet_days" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "scheduledHours" DECIMAL(15,4) NOT NULL DEFAULT 8,
    "workedHours" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "overtimeHours" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "nightHours" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "absenceHours" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "isWeekend" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overtime_50" DECIMAL(15,4) DEFAULT 0,
    "overtime_100" DECIMAL(15,4) DEFAULT 0,

    CONSTRAINT "timesheet_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" "WorkScheduleType" NOT NULL DEFAULT 'FIXED',
    "description" TEXT,
    "weeklyHours" DECIMAL(15,4) NOT NULL DEFAULT 44,
    "dailyHours" DECIMAL(15,4) NOT NULL DEFAULT 8,
    "toleranceMinutes" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_shifts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scheduleId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStartTime" TEXT,
    "breakEndTime" TEXT,
    "breakDuration" INTEGER NOT NULL DEFAULT 60,
    "isWorkDay" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "work_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hours_bank" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "type" "HoursBankType" NOT NULL,
    "date" DATE NOT NULL,
    "hours" DECIMAL(15,4) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "referenceId" UUID,
    "description" TEXT,
    "expiresAt" DATE,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hours_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_clock_adjustments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "originalEntryId" UUID,
    "adjustmentType" TEXT NOT NULL,
    "clockType" "TimeClockType" NOT NULL,
    "originalTime" TIMESTAMP(3),
    "newTime" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" "TimeClockAdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" UUID,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,

    CONSTRAINT "time_clock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "companyId" UUID,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NATIONAL',
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" INTEGER NOT NULL,
    "companyId" UUID NOT NULL,
    "referenceMonth" INTEGER NOT NULL,
    "referenceYear" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalGross" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "processedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" UUID,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payrollId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "baseSalary" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "workedDays" INTEGER NOT NULL DEFAULT 0,
    "workedHours" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "overtimeHours" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "nightHours" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "absenceDays" INTEGER NOT NULL DEFAULT 0,
    "grossSalary" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "inss" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "irrf" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fgts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payrollItemId" UUID NOT NULL,
    "type" "PayrollEventType" NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reference" DECIMAL(15,2),
    "value" DECIMAL(15,2) NOT NULL,
    "isDeduction" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "acquisitionStart" DATE NOT NULL,
    "acquisitionEnd" DATE NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalDays" INTEGER DEFAULT 30,
    "soldDays" INTEGER DEFAULT 0,
    "enjoyedDays" INTEGER DEFAULT 30,
    "status" "VacationStatus" DEFAULT 'SCHEDULED',
    "baseSalary" DECIMAL(15,2) DEFAULT 0,
    "vacationPay" DECIMAL(15,2) DEFAULT 0,
    "oneThirdBonus" DECIMAL(15,2) DEFAULT 0,
    "soldDaysValue" DECIMAL(15,2) DEFAULT 0,
    "totalGross" DECIMAL(15,2) DEFAULT 0,
    "inssDeduction" DECIMAL(15,2) DEFAULT 0,
    "irrfDeduction" DECIMAL(15,2) DEFAULT 0,
    "otherDeductions" DECIMAL(15,2) DEFAULT 0,
    "totalNet" DECIMAL(15,2) DEFAULT 0,
    "paymentDate" DATE,
    "noticeDate" DATE,
    "isCollective" BOOLEAN DEFAULT false,
    "collectiveGroupId" UUID,
    "notes" TEXT,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thirteenth_salaries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "ThirteenthType" NOT NULL,
    "status" "ThirteenthStatus" DEFAULT 'PENDING',
    "monthsWorked" INTEGER DEFAULT 12,
    "baseSalary" DECIMAL(15,2) DEFAULT 0,
    "averageVariable" DECIMAL(15,2) DEFAULT 0,
    "grossValue" DECIMAL(15,2) DEFAULT 0,
    "inssDeduction" DECIMAL(15,2) DEFAULT 0,
    "irrfDeduction" DECIMAL(15,2) DEFAULT 0,
    "otherDeductions" DECIMAL(15,2) DEFAULT 0,
    "netValue" DECIMAL(15,2) DEFAULT 0,
    "paymentDate" DATE,
    "notes" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thirteenth_salaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "type" "TerminationType" NOT NULL,
    "status" "TerminationStatus" DEFAULT 'DRAFT',
    "noticeDate" DATE,
    "terminationDate" DATE NOT NULL,
    "lastWorkDay" DATE,
    "noticePeriodDays" INTEGER DEFAULT 30,
    "noticePeriodWorked" BOOLEAN DEFAULT false,
    "noticePeriodIndemnity" BOOLEAN DEFAULT false,
    "baseSalary" DECIMAL(15,2) DEFAULT 0,
    "salaryBalance" DECIMAL(15,2) DEFAULT 0,
    "noticePeriodValue" DECIMAL(15,2) DEFAULT 0,
    "vacationBalance" DECIMAL(15,2) DEFAULT 0,
    "vacationProportional" DECIMAL(15,2) DEFAULT 0,
    "vacationOneThird" DECIMAL(15,2) DEFAULT 0,
    "thirteenthProportional" DECIMAL(15,2) DEFAULT 0,
    "fgtsBalance" DECIMAL(15,2) DEFAULT 0,
    "fgtsFine" DECIMAL(15,2) DEFAULT 0,
    "otherEarnings" DECIMAL(15,2) DEFAULT 0,
    "totalGross" DECIMAL(15,2) DEFAULT 0,
    "inssDeduction" DECIMAL(15,2) DEFAULT 0,
    "irrfDeduction" DECIMAL(15,2) DEFAULT 0,
    "advanceDeduction" DECIMAL(15,2) DEFAULT 0,
    "otherDeductions" DECIMAL(15,2) DEFAULT 0,
    "totalDeductions" DECIMAL(15,2) DEFAULT 0,
    "totalNet" DECIMAL(15,2) DEFAULT 0,
    "paymentDate" DATE,
    "homologationDate" DATE,
    "trctNumber" VARCHAR(50),
    "grffGenerated" BOOLEAN DEFAULT false,
    "grffDate" DATE,
    "eligibleForUnemployment" BOOLEAN DEFAULT false,
    "unemploymentGuides" INTEGER DEFAULT 0,
    "notes" TEXT,
    "reason" TEXT,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terminations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefit_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "company_id" UUID NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "calculation_type" TEXT NOT NULL DEFAULT 'FIXED',
    "default_value" DECIMAL(15,2) DEFAULT 0,
    "default_percentage" DECIMAL(10,4) DEFAULT 0,
    "employee_discount_percent" DECIMAL(10,4) DEFAULT 0,
    "is_taxable" BOOLEAN DEFAULT false,
    "affects_inss" BOOLEAN DEFAULT false,
    "affects_irrf" BOOLEAN DEFAULT false,
    "affects_fgts" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benefit_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_benefits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "benefit_type_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "value" DECIMAL(15,2) DEFAULT 0,
    "employee_discount" DECIMAL(15,2) DEFAULT 0,
    "company_contribution" DECIMAL(15,2) DEFAULT 0,
    "quantity" DECIMAL(15,4) DEFAULT 1,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_vouchers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "line_type" TEXT NOT NULL DEFAULT 'BUS',
    "line_name" TEXT NOT NULL,
    "fare_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "quantity_per_day" INTEGER DEFAULT 2,
    "working_days" INTEGER DEFAULT 22,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "company_id" UUID NOT NULL,
    "category" TEXT,
    "duration_hours" INTEGER DEFAULT 0,
    "instructor" TEXT,
    "provider" TEXT,
    "cost" DECIMAL(15,2) DEFAULT 0,
    "is_mandatory" BOOLEAN DEFAULT false,
    "validity_months" INTEGER,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_trainings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_date" TIMESTAMP(3),
    "completion_date" TIMESTAMP(3),
    "expiration_date" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "certificate_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_matrix" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "skill_name" TEXT NOT NULL,
    "company_id" UUID NOT NULL,
    "category" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "max_level" INTEGER DEFAULT 4,
    "certified_at" TIMESTAMP(3),
    "certified_by" UUID,
    "expiration_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_processes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" SERIAL NOT NULL,
    "company_id" UUID NOT NULL,
    "candidate_name" TEXT NOT NULL,
    "candidate_email" TEXT,
    "candidate_phone" TEXT,
    "candidate_cpf" TEXT,
    "candidate_rg" TEXT,
    "candidate_birth_date" DATE,
    "candidate_gender" TEXT,
    "candidate_marital_status" TEXT,
    "candidate_mobile" TEXT,
    "candidate_address" TEXT,
    "candidate_address_number" TEXT,
    "candidate_address_complement" TEXT,
    "candidate_address_neighborhood" TEXT,
    "candidate_address_city" TEXT,
    "candidate_address_state" TEXT,
    "candidate_address_zip_code" TEXT,
    "position_id" UUID,
    "department_id" UUID,
    "proposed_salary" DECIMAL(15,2),
    "proposed_start_date" TIMESTAMP(3),
    "contract_type" TEXT,
    "work_hours_per_day" DECIMAL(65,30),
    "work_days_per_week" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "current_step" INTEGER DEFAULT 1,
    "total_steps" INTEGER DEFAULT 5,
    "recruiter_id" UUID,
    "manager_id" UUID,
    "notes" TEXT,
    "candidate_pis" TEXT,
    "candidate_ctps" TEXT,
    "candidate_ctps_series" TEXT,
    "candidate_voter_registration" TEXT,
    "candidate_military_service" TEXT,
    "candidate_bank_name" TEXT,
    "candidate_bank_code" TEXT,
    "candidate_bank_branch" TEXT,
    "candidate_bank_agency" TEXT,
    "candidate_bank_account" TEXT,
    "candidate_bank_account_digit" TEXT,
    "candidate_bank_account_type" TEXT,
    "candidate_pix_key" TEXT,
    "candidate_photo" TEXT,
    "access_token" UUID,
    "token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "admission_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_steps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admission_id" UUID NOT NULL,
    "step_number" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "step_type" TEXT NOT NULL DEFAULT 'DOCUMENT',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assigned_to" UUID,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "completed_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admission_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_name" TEXT NOT NULL,
    "file_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "is_required" BOOLEAN DEFAULT true,
    "uploaded_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "verified_by" UUID,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_exams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admission_id" UUID NOT NULL,
    "exam_type" TEXT NOT NULL DEFAULT 'ADMISSIONAL',
    "clinic_name" TEXT,
    "scheduled_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "result" TEXT,
    "aso_number" TEXT,
    "aso_url" TEXT,
    "valid_until" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_dependents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" VARCHAR(14),
    "birth_date" DATE,
    "type" "DependentType" NOT NULL,
    "is_ir_deductible" BOOLEAN NOT NULL DEFAULT false,
    "is_salario_familia" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_dependents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "type" "LeaveType" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "days" INTEGER,
    "cid" VARCHAR(10),
    "document_number" TEXT,
    "notes" TEXT,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_tax_tables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "min_value" DECIMAL(15,2) NOT NULL,
    "max_value" DECIMAL(15,2),
    "rate" DECIMAL(5,2) NOT NULL,
    "deduction" DECIMAL(15,2) NOT NULL,
    "dependent_deduction" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_tax_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inss_tables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "min_value" DECIMAL(15,2) NOT NULL,
    "max_value" DECIMAL(15,2) NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "ceiling" DECIMAL(15,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inss_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "type" "port_type" NOT NULL,
    "companyId" UUID,
    "isShared" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customs_brokers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "companyId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customs_brokers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" UUID,
    "isShared" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargo_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incoterms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" UUID,
    "isShared" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incoterms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_processes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "process_number" VARCHAR(50) NOT NULL,
    "reference" VARCHAR(100),
    "supplier_id" UUID,
    "broker_id" UUID,
    "incoterm_id" UUID,
    "cargo_type_id" UUID,
    "origin_port_id" UUID,
    "destination_port_id" UUID,
    "status" "import_status" NOT NULL DEFAULT 'DRAFT',
    "order_date" DATE,
    "etd" DATE,
    "eta" DATE,
    "actual_departure" DATE,
    "actual_arrival" DATE,
    "clearance_date" DATE,
    "delivery_date" DATE,
    "vessel_name" VARCHAR(200),
    "voyage_number" VARCHAR(50),
    "bl_number" VARCHAR(100),
    "container_numbers" TEXT,
    "currency" VARCHAR(3) DEFAULT 'USD',
    "fob_value" DECIMAL(18,2) DEFAULT 0,
    "freight_value" DECIMAL(18,2) DEFAULT 0,
    "insurance_value" DECIMAL(18,2) DEFAULT 0,
    "cif_value" DECIMAL(18,2) DEFAULT 0,
    "customs_fees" DECIMAL(18,2) DEFAULT 0,
    "storage_fees" DECIMAL(18,2) DEFAULT 0,
    "other_costs" DECIMAL(18,2) DEFAULT 0,
    "total_cost_brl" DECIMAL(18,2) DEFAULT 0,
    "di_number" VARCHAR(50),
    "di_date" DATE,
    "notes" TEXT,
    "company_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_process_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "import_process_id" UUID NOT NULL,
    "material_id" UUID,
    "purchase_order_id" UUID,
    "description" VARCHAR(500),
    "ncm_code" VARCHAR(10),
    "quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unit" VARCHAR(10),
    "unit_price" DECIMAL(18,6) DEFAULT 0,
    "total_price" DECIMAL(18,2) DEFAULT 0,
    "ii_percent" DECIMAL(5,2) DEFAULT 0,
    "ii_value" DECIMAL(18,2) DEFAULT 0,
    "ipi_percent" DECIMAL(5,2) DEFAULT 0,
    "ipi_value" DECIMAL(18,2) DEFAULT 0,
    "pis_percent" DECIMAL(5,2) DEFAULT 0,
    "pis_value" DECIMAL(18,2) DEFAULT 0,
    "cofins_percent" DECIMAL(5,2) DEFAULT 0,
    "cofins_value" DECIMAL(18,2) DEFAULT 0,
    "icms_percent" DECIMAL(5,2) DEFAULT 0,
    "icms_value" DECIMAL(18,2) DEFAULT 0,
    "total_taxes" DECIMAL(18,2) DEFAULT 0,
    "landed_cost" DECIMAL(18,2) DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_process_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_process_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "import_process_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "event_date" TIMESTAMPTZ(6) NOT NULL,
    "description" TEXT,
    "user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_process_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_process_costs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "import_process_id" UUID NOT NULL,
    "cost_type" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "is_estimated" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_process_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_contracts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_number" VARCHAR(100) NOT NULL,
    "bank_account_id" UUID NOT NULL,
    "process_id" UUID,
    "foreign_value" DECIMAL(15,2) NOT NULL,
    "foreign_currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "contract_rate" DECIMAL(10,6) NOT NULL,
    "brl_value" DECIMAL(15,2) NOT NULL,
    "contract_date" DATE NOT NULL,
    "maturity_date" DATE NOT NULL,
    "liquidation_date" DATE,
    "liquidated_value" DECIMAL(15,2),
    "liquidation_rate" DECIMAL(10,6),
    "exchange_variation" DECIMAL(15,2),
    "status" "exchange_status" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "company_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_liquidations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "foreign_value" DECIMAL(15,2) NOT NULL,
    "liquidation_rate" DECIMAL(10,6) NOT NULL,
    "brl_value" DECIMAL(15,2) NOT NULL,
    "variation" DECIMAL(15,2) NOT NULL,
    "liquidation_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_liquidations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" INTEGER NOT NULL,
    "internalCode" TEXT,
    "description" TEXT NOT NULL,
    "categoryId" UUID,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "location" TEXT,
    "minQuantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "maxQuantity" DECIMAL(15,4),
    "monthlyAverage" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "lastPurchasePrice" DECIMAL(15,2),
    "lastPurchaseDate" TIMESTAMP(3),
    "ncm" TEXT,
    "status" "MaterialStatus" NOT NULL DEFAULT 'ACTIVE',
    "requiresQualityCheck" BOOLEAN NOT NULL DEFAULT false,
    "companyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "purchase_unit" TEXT,
    "unit_conversion_factor" DECIMAL(10,4) DEFAULT 1,
    "sub_category_id" UUID,
    "write_off_code" TEXT,
    "is_epi" BOOLEAN DEFAULT false,
    "is_office_supply" BOOLEAN DEFAULT false,
    "notes" TEXT,
    "ipi_rate" DECIMAL(10,4) DEFAULT 0,
    "icms_rate" DECIMAL(10,4) DEFAULT 0,
    "avg_delivery_days" DECIMAL(15,4) DEFAULT 0,
    "calculated_min_quantity" DECIMAL(15,4) DEFAULT 0,
    "min_quantity_calc_type" TEXT DEFAULT 'MANUAL',
    "min_quantity_alarm_date" TIMESTAMP(6),
    "min_quantity_calc_date" TIMESTAMP(6),
    "adjust_max_consumption_manual" BOOLEAN DEFAULT false,
    "max_monthly_consumption" DECIMAL(15,4) DEFAULT 0,
    "reserved_quantity" DECIMAL(15,4) DEFAULT 0,
    "peak_12_months" DECIMAL(15,4) DEFAULT 0,
    "last_purchase_unit_price_avg" DECIMAL(15,2) DEFAULT 0,
    "last_purchase_quantity" DECIMAL(15,4) DEFAULT 0,
    "last_supplier_id" UUID,
    "cost_center_frm" TEXT,
    "cost_center_fnd" TEXT,
    "financial_account" TEXT,
    "required_brand" TEXT,
    "required_brand_reason" TEXT,
    "stock_location_id" UUID,
    "requires_quality_inspection" BOOLEAN DEFAULT false,
    "requires_material_certificate" BOOLEAN DEFAULT false,
    "requires_control_sheets" BOOLEAN DEFAULT false,
    "requires_return" BOOLEAN DEFAULT false,
    "requires_fiscal_entry" BOOLEAN DEFAULT false,
    "parent_product_id" UUID,
    "asset_id" UUID,
    "weight" DECIMAL(15,4) DEFAULT 0,
    "weight_unit" TEXT DEFAULT 'KG',
    "barcode" TEXT,
    "manufacturer" TEXT,
    "manufacturer_code" TEXT,
    "epi_ca_code" TEXT,
    "financial_validated" BOOLEAN NOT NULL DEFAULT false,
    "financial_validated_cc" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "materialId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "inventoryType" "InventoryType" NOT NULL DEFAULT 'RAW_MATERIAL',
    "quantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "reservedQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "availableQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "lastMovementAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "quantity_semi_finished" DECIMAL(15,4) DEFAULT 0,
    "quantity_finished" DECIMAL(15,4) DEFAULT 0,
    "quantity_critical" DECIMAL(15,4) DEFAULT 0,
    "quantity_scrap" DECIMAL(15,4) DEFAULT 0,
    "quantity_dead" DECIMAL(15,4) DEFAULT 0,
    "quantity_accounting_ind" DECIMAL(15,4) DEFAULT 0,
    "quantity_accounting_resale" DECIMAL(15,4) DEFAULT 0,
    "quantity_on_order" DECIMAL(15,4) DEFAULT 0,
    "expected_delivery_date" TIMESTAMPTZ(6),
    "consumption_rule_id" TEXT,
    "consume_by_formula" BOOLEAN DEFAULT false,
    "legacy_product_code" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventoryId" UUID NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unitCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balanceAfter" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "documentId" TEXT,
    "supplierId" UUID,
    "notes" TEXT,
    "userId" UUID,
    "movementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" INTEGER NOT NULL,
    "companyId" UUID NOT NULL,
    "inventoryId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "consumedQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "documentType" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "releasedBy" TEXT,
    "releaseReason" TEXT,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "LocationType" NOT NULL DEFAULT 'WAREHOUSE',
    "parentId" UUID,
    "companyId" UUID NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_inventory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "locationId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "reservedQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "minQuantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "maxQuantity" DECIMAL(15,4),
    "lastMovementAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" INTEGER NOT NULL,
    "companyId" UUID NOT NULL,
    "fromLocationId" UUID NOT NULL,
    "toLocationId" UUID NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" UUID,
    "shippedAt" TIMESTAMP(3),
    "shippedBy" UUID,
    "receivedAt" TIMESTAMP(3),
    "receivedBy" UUID,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" UUID,
    "cancellationReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transferId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "requestedQty" DECIMAL(15,4) NOT NULL,
    "shippedQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "receivedQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_inventories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" INTEGER NOT NULL,
    "companyId" UUID NOT NULL,
    "locationId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdBy" UUID,
    "closedBy" UUID,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "physical_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_counts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventoryId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "locationId" UUID,
    "systemQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "countedQty" DECIMAL(15,4),
    "difference" DECIMAL(15,2),
    "countedBy" UUID,
    "countedAt" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "material_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "status" "LotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "quantity" DECIMAL(15,4) NOT NULL,
    "reserved_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(15,4),
    "manufacture_date" DATE,
    "expiration_date" DATE,
    "supplier_id" UUID,
    "location_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lot_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lot_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "document_type" TEXT,
    "document_id" UUID,
    "notes" TEXT,
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lot_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intercompany_transfers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" SERIAL NOT NULL,
    "source_company_id" UUID NOT NULL,
    "target_company_id" UUID NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'DRAFT',
    "transfer_date" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intercompany_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intercompany_transfer_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transfer_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_cost" DECIMAL(15,4),
    "lot_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intercompany_transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_equipment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "manufacturer" VARCHAR(200),
    "model" VARCHAR(200),
    "serial_number" VARCHAR(100),
    "install_date" TIMESTAMP(3),
    "warranty_expiry" TIMESTAMP(3),
    "criticality" "EquipmentCriticality" NOT NULL DEFAULT 'B',
    "location" VARCHAR(200),
    "operating_hours" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "work_center_id" UUID,
    "fixed_asset_id" UUID,
    "parent_id" UUID,
    "technical_specs" JSONB,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "equipment_id" UUID NOT NULL,
    "type" "MaintenanceType" NOT NULL DEFAULT 'PREVENTIVE',
    "frequency" "MaintenanceFrequency" NOT NULL DEFAULT 'MONTHLY',
    "frequency_value" INTEGER NOT NULL DEFAULT 1,
    "trigger_hours" DECIMAL(15,2),
    "estimated_duration" INTEGER NOT NULL DEFAULT 60,
    "checklist" JSONB,
    "required_parts" JSONB,
    "assigned_team" VARCHAR(200),
    "last_executed_at" TIMESTAMP(3),
    "next_due_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" INTEGER NOT NULL,
    "equipment_id" UUID NOT NULL,
    "plan_id" UUID,
    "type" "MaintenanceType" NOT NULL DEFAULT 'CORRECTIVE',
    "status" "MaintenanceOrderStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'NORMAL',
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "failure_description" TEXT,
    "failure_code_id" UUID,
    "requested_by" UUID,
    "assigned_to" UUID,
    "planned_start" TIMESTAMP(3),
    "planned_end" TIMESTAMP(3),
    "actual_start" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "estimated_duration" INTEGER,
    "actual_duration" INTEGER,
    "downtime" INTEGER,
    "root_cause" TEXT,
    "solution" TEXT,
    "notes" TEXT,
    "completed_by" UUID,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "cancelled_by" UUID,
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_order_parts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_order_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_order_labor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "employee_id" UUID,
    "tech_name" VARCHAR(200),
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "hours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "hourly_rate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_order_labor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_checklists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "completed_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "failure_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(300),
    "severity" INTEGER NOT NULL DEFAULT 3,
    "category" "FailureCategory" NOT NULL DEFAULT 'OTHER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "failure_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_failure_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "equipment_id" UUID NOT NULL,
    "failure_code_id" UUID NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 0,
    "last_occurrence" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_failure_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" INTEGER NOT NULL,
    "companyId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "producedQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "salesOrderNumber" VARCHAR(50),
    "customerName" VARCHAR(200),
    "notes" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "request_type" "production_request_type",
    "execution_type" "production_execution_type",
    "customer_id" TEXT,
    "delivery_date" TIMESTAMPTZ(6),
    "delivery_type" "production_delivery_type",
    "suggested_delivery_date" TIMESTAMPTZ(6),
    "delivery_date_changed" BOOLEAN DEFAULT false,
    "responsible_employee_id" TEXT,
    "delivery_user_id" TEXT,
    "finished_quantity" INTEGER DEFAULT 0,
    "painted_quantity" INTEGER DEFAULT 0,
    "raw_material_origin" "raw_material_origin",
    "export_code" INTEGER,
    "grouped_order_id" TEXT,
    "type_before_urgency" INTEGER,
    "date_before_urgency" TIMESTAMPTZ(6),
    "printed" BOOLEAN DEFAULT false,

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_order_materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "requiredQty" DECIMAL(15,4) NOT NULL,
    "consumedQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_order_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_order_operations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "workCenter" VARCHAR(100),
    "setupTime" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "runTime" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "actualSetupTime" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "actualRunTime" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "plannedQty" DECIMAL(15,4) NOT NULL,
    "completedQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "scrapQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_order_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parentMaterialId" UUID NOT NULL,
    "childMaterialId" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "scrapPercentage" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_parameters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "materialId" UUID NOT NULL,
    "minLotSize" DECIMAL(15,4) NOT NULL DEFAULT 1,
    "lotMultiple" DECIMAL(15,2) NOT NULL DEFAULT 1,
    "safetyStock" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "productionLeadTimeDays" INTEGER NOT NULL DEFAULT 1,
    "purchaseLeadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "orderPolicy" TEXT NOT NULL DEFAULT 'LOT_FOR_LOT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mrp_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horizonDays" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "totalSuggestions" INTEGER NOT NULL DEFAULT 0,
    "productionSuggestions" INTEGER NOT NULL DEFAULT 0,
    "purchaseSuggestions" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "notes" TEXT,

    CONSTRAINT "mrp_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_suggestions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "runId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "type" "MrpSuggestionType" NOT NULL,
    "status" "MrpSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "suggestedDate" TIMESTAMP(3) NOT NULL,
    "requiredDate" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "sourceOrderId" UUID,
    "sourceOrderType" TEXT,
    "reason" TEXT,
    "convertedOrderId" UUID,
    "convertedAt" TIMESTAMP(3),
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" UUID,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mrp_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_centers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" UUID NOT NULL,
    "capacityPerHour" DECIMAL(15,4) NOT NULL DEFAULT 1,
    "hoursPerDay" DECIMAL(15,4) NOT NULL DEFAULT 8,
    "daysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "efficiencyTarget" DECIMAL(15,2) NOT NULL DEFAULT 85,
    "setupTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "costPerHour" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workCenterId" UUID NOT NULL,
    "productionOrderId" UUID,
    "operatorId" UUID,
    "shiftDate" DATE NOT NULL,
    "shiftNumber" INTEGER NOT NULL DEFAULT 1,
    "plannedQuantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "producedQuantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "goodQuantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "scrapQuantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "reworkQuantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "plannedTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "actualTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "setupTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "runTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "stopTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "cycleTimeSeconds" DECIMAL(15,2),
    "idealCycleTimeSeconds" DECIMAL(15,2),
    "notes" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_stops" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workCenterId" UUID NOT NULL,
    "productionLogId" UUID,
    "stopType" "StopType" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "reason" TEXT NOT NULL,
    "solution" TEXT,
    "reportedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oee_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "workCenterId" UUID,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "availabilityTarget" DOUBLE PRECISION NOT NULL DEFAULT 90,
    "performanceTarget" DOUBLE PRECISION NOT NULL DEFAULT 95,
    "qualityTarget" DOUBLE PRECISION NOT NULL DEFAULT 99,
    "oeeTarget" DOUBLE PRECISION NOT NULL DEFAULT 85,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oee_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_costs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "production_order_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "material_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "material_cost_std" DECIMAL(15,2) DEFAULT 0,
    "material_variance" DECIMAL(15,2) DEFAULT 0,
    "labor_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "labor_cost_std" DECIMAL(15,2) DEFAULT 0,
    "labor_variance" DECIMAL(15,2) DEFAULT 0,
    "labor_hours" DECIMAL(15,4) DEFAULT 0,
    "labor_hours_std" DECIMAL(15,4) DEFAULT 0,
    "overhead_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "overhead_cost_std" DECIMAL(15,2) DEFAULT 0,
    "overhead_variance" DECIMAL(15,2) DEFAULT 0,
    "total_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_cost_std" DECIMAL(15,2) DEFAULT 0,
    "total_variance" DECIMAL(15,2) DEFAULT 0,
    "unit_cost" DECIMAL(15,2) DEFAULT 0,
    "unit_cost_std" DECIMAL(15,2) DEFAULT 0,
    "quantity_produced" DECIMAL(15,4) DEFAULT 0,
    "calculated_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_cost_materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "production_cost_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "quantity_std" DECIMAL(15,4) DEFAULT 0,
    "quantity_actual" DECIMAL(15,4) DEFAULT 0,
    "unit_cost" DECIMAL(15,2) DEFAULT 0,
    "total_cost_std" DECIMAL(15,2) DEFAULT 0,
    "total_cost_actual" DECIMAL(15,2) DEFAULT 0,
    "variance" DECIMAL(15,2) DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_cost_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_cost_labor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "production_cost_id" UUID NOT NULL,
    "work_center_id" UUID,
    "operation_id" UUID,
    "hours_std" DECIMAL(15,4) DEFAULT 0,
    "hours_actual" DECIMAL(15,4) DEFAULT 0,
    "hourly_rate" DECIMAL(10,4) DEFAULT 0,
    "total_cost_std" DECIMAL(15,2) DEFAULT 0,
    "total_cost_actual" DECIMAL(15,2) DEFAULT 0,
    "variance" DECIMAL(15,2) DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_cost_labor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_standard_costs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "material_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "material_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "labor_cost" DECIMAL(15,2) DEFAULT 0,
    "overhead_cost" DECIMAL(15,2) DEFAULT 0,
    "total_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_standard_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT,
    "cpf" TEXT,
    "ie" TEXT,
    "im" TEXT,
    "address" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Brasil',
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "website" TEXT,
    "contactName" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "qualityIndex" DECIMAL(10,4),
    "companyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "cat01_embalagens" BOOLEAN DEFAULT false,
    "cat02_tintas" BOOLEAN DEFAULT false,
    "cat03_oleos_graxas" BOOLEAN DEFAULT false,
    "cat04_dispositivos" BOOLEAN DEFAULT false,
    "cat05_acessorios" BOOLEAN DEFAULT false,
    "cat06_manutencao" BOOLEAN DEFAULT false,
    "cat07_servicos" BOOLEAN DEFAULT false,
    "cat08_escritorio" BOOLEAN DEFAULT false,
    "is_wholesaler" BOOLEAN DEFAULT false,
    "is_retailer" BOOLEAN DEFAULT false,
    "is_industry" BOOLEAN DEFAULT false,
    "is_service" BOOLEAN DEFAULT false,
    "activity_type_id" TEXT,
    "cnae" TEXT,
    "certification_type" "supplier_certification_type",
    "certification_expiry_date" TIMESTAMPTZ(6),
    "certification_file_name" TEXT,
    "overall_quality_percent" DECIMAL(10,4),
    "iqf_percent" DECIMAL(10,4),
    "quality_calc_date" TIMESTAMPTZ(6),
    "iqf_status" "supplier_iqf_status",
    "tax_regime" TEXT,
    "sefaz_query_date" TIMESTAMPTZ(6),
    "has_financial_contract" BOOLEAN DEFAULT false,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplierId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "supplierCode" TEXT,
    "lastPrice" DECIMAL(15,2),
    "lastPriceDate" TIMESTAMP(3),
    "leadTimeDays" INTEGER,
    "minOrderQty" DECIMAL(15,4),
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" INTEGER NOT NULL,
    "supplierId" UUID NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "deliveryTerms" TEXT,
    "freightValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discountPercent" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revision" INTEGER DEFAULT 1,
    "pre_approved_by_id" TEXT,
    "pre_approved_at" TIMESTAMPTZ(6),
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMPTZ(6),
    "materials_modified_by_id" TEXT,
    "materials_modified_at" TIMESTAMPTZ(6),
    "suppliers_modified_by_id" TEXT,
    "suppliers_modified_at" TIMESTAMPTZ(6),
    "quote_pdf_name" TEXT,
    "quote_printed_at" TIMESTAMPTZ(6),
    "attachment1" TEXT,
    "attachment2" TEXT,
    "attachment3" TEXT,
    "analysis_executed" BOOLEAN DEFAULT false,
    "conversation_history" TEXT,
    "owner_company_id" TEXT,
    "cost_center_group" INTEGER,
    "requisition_id" TEXT,
    "requester_name" TEXT,
    "approver_name" TEXT,
    "completion_percent" INTEGER DEFAULT 0,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quoteId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deliveryDays" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" INTEGER NOT NULL,
    "supplierId" UUID NOT NULL,
    "quoteId" UUID,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "deliveryTerms" TEXT,
    "freightValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discountPercent" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "companyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "application" TEXT,
    "quote_supplier_code" INTEGER,
    "billing_company_id" TEXT,
    "cost_center_group" INTEGER,
    "carrier" TEXT,
    "delivery_address" TEXT,
    "delivery_phone" TEXT,
    "operation_nature" "operation_nature",
    "payment_condition_id" TEXT,
    "payment_condition_desc" TEXT,
    "freight_type" "freight_type",
    "fob_freight_value" DECIMAL(15,2) DEFAULT 0,
    "pickup_km" DOUBLE PRECISION,
    "pickup_value" DECIMAL(15,2),
    "cancellation_reason" TEXT,
    "financial_approved" BOOLEAN DEFAULT false,
    "financial_approved_by_id" TEXT,
    "financial_approved_at" TIMESTAMPTZ(6),
    "analysis_approved_by_id" TEXT,
    "analysis_approved_at" TIMESTAMPTZ(6),

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchaseOrderId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quoteItemId" UUID,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "receivedQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "deliveryDays" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_requisitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" INTEGER NOT NULL,
    "companyId" UUID NOT NULL,
    "type" "RequisitionType" NOT NULL DEFAULT 'PRODUCTION',
    "costCenter" VARCHAR(50),
    "projectCode" VARCHAR(50),
    "orderNumber" VARCHAR(50),
    "requestedBy" UUID,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department" VARCHAR(100),
    "status" "RequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "separatedBy" UUID,
    "separatedAt" TIMESTAMP(3),
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_requisition_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requisitionId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "requestedQty" DECIMAL(15,4) NOT NULL,
    "approvedQty" DECIMAL(15,4),
    "separatedQty" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_requisition_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisition_approvals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requisitionId" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "approverId" UUID NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requisition_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_returns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "returnNumber" SERIAL NOT NULL,
    "status" "SupplierReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "supplierId" UUID NOT NULL,
    "receivedInvoiceId" UUID,
    "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" UUID,
    "invoicedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" UUID,
    "cancellationReason" TEXT,
    "returnInvoiceId" UUID,
    "returnInvoiceNumber" INTEGER,
    "returnInvoiceKey" VARCHAR(44),
    "notes" TEXT,
    "companyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "supplier_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_return_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "returnId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "receivedInvoiceItemId" UUID,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "reason" "ReturnReason" NOT NULL DEFAULT 'OTHER',
    "reasonNotes" TEXT,
    "stockLocationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_inspections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" INTEGER NOT NULL,
    "company_id" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RECEIVING',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "material_id" UUID,
    "production_order_id" UUID,
    "received_invoice_id" UUID,
    "lot_number" TEXT,
    "quantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "sample_size" INTEGER,
    "approved_qty" DECIMAL(15,4) DEFAULT 0,
    "rejected_qty" DECIMAL(15,4) DEFAULT 0,
    "inspection_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "inspector_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_inspection_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inspection_id" UUID NOT NULL,
    "characteristic" TEXT NOT NULL,
    "specification" TEXT,
    "tolerance_min" DECIMAL(10,4),
    "tolerance_max" DECIMAL(10,4),
    "measured_value" DECIMAL(15,6),
    "result" TEXT DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_conformities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" INTEGER NOT NULL,
    "company_id" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INTERNAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "severity" TEXT NOT NULL DEFAULT 'MINOR',
    "inspection_id" UUID,
    "production_order_id" UUID,
    "material_id" UUID,
    "lot_number" TEXT,
    "quantity" DECIMAL(15,4) DEFAULT 0,
    "description" TEXT NOT NULL,
    "root_cause" TEXT,
    "immediate_action" TEXT,
    "corrective_action" TEXT,
    "preventive_action" TEXT,
    "responsible_id" UUID,
    "due_date" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "closed_by" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "non_conformities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_receivings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" INTEGER NOT NULL,
    "companyId" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "purchaseOrderId" UUID,
    "invoiceId" UUID,
    "status" "ReceivingStatus" NOT NULL DEFAULT 'PENDING',
    "receivingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "nfeNumber" TEXT,
    "nfeSeries" TEXT,
    "nfeKey" TEXT,
    "nfeXml" TEXT,
    "nfeIssueDate" TIMESTAMP(3),
    "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "freightValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "insuranceValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discountValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherExpenses" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "locationId" UUID,
    "notes" TEXT,
    "internalNotes" TEXT,
    "conferredBy" UUID,
    "conferredAt" TIMESTAMP(3),
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" UUID,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_receivings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_receiving_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "receivingId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "purchaseOrderItemId" UUID,
    "nfeItemNumber" INTEGER,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "nfeQuantity" DECIMAL(15,4) NOT NULL,
    "receivedQuantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "approvedQuantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "rejectedQuantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "icmsBase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "icmsValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ipiBase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ipiValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "ReceivingItemStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "batchNumber" TEXT,
    "expirationDate" TIMESTAMP(3),
    "certificateNumber" TEXT,
    "qualityStatus" TEXT,
    "qualityNotes" TEXT,
    "locationId" UUID,
    "conferredBy" UUID,
    "conferredAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_receiving_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receiving_divergences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "receivingItemId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "expectedValue" TEXT,
    "receivedValue" TEXT,
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "resolvedBy" UUID,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receiving_divergences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_certificates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "receivingItemId" UUID NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "issuer" TEXT,
    "fileUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "picking_lists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    "type" VARCHAR(50) NOT NULL DEFAULT 'REQUISITION',
    "sourceId" UUID,
    "sourceType" VARCHAR(50),
    "assignedTo" UUID,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "picking_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "picking_list_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pickingListId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "locationId" UUID,
    "requestedQty" DECIMAL(15,4) NOT NULL,
    "pickedQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "lotNumber" VARCHAR(100),
    "serialNumber" VARCHAR(100),
    "expirationDate" DATE,
    "notes" TEXT,
    "pickedAt" TIMESTAMP(3),
    "pickedBy" UUID,

    CONSTRAINT "picking_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "picking_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pickingListId" UUID NOT NULL,
    "verifiedBy" UUID NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL,
    "discrepancies" JSONB DEFAULT '[]',
    "notes" TEXT,

    CONSTRAINT "picking_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" TEXT NOT NULL,
    "companyId" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'COMPANY',
    "companyName" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT,
    "cpf" TEXT,
    "stateRegistration" TEXT,
    "municipalRegistration" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "website" TEXT,
    "contactName" TEXT,
    "addressStreet" TEXT,
    "addressNumber" TEXT,
    "addressComplement" TEXT,
    "addressNeighborhood" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZipCode" TEXT,
    "creditLimit" DECIMAL(15,2) DEFAULT 0,
    "paymentTermDays" INTEGER DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "customer_group_id" TEXT,
    "customer_type_id" TEXT,
    "alpha_code" TEXT,
    "sales_rep_id" TEXT,
    "external_sales_rep_id" TEXT,
    "main_contact_id" TEXT,
    "last_visit_date" TIMESTAMPTZ(6),
    "relationship_start_date" TIMESTAMPTZ(6),
    "visit_frequency" INTEGER,
    "generate_periodic_visit" BOOLEAN DEFAULT false,
    "min_invoice_value" DECIMAL(15,4),
    "default_message" TEXT,
    "default_payment_condition" TEXT,
    "apply_st" BOOLEAN DEFAULT false,
    "default_order_notes" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "companyId" UUID NOT NULL,
    "customerId" UUID,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'OTHER',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "estimatedValue" DECIMAL(15,2),
    "probability" INTEGER DEFAULT 50,
    "expectedCloseDate" TIMESTAMP(3),
    "description" TEXT,
    "notes" TEXT,
    "assignedTo" UUID,
    "lastContactAt" TIMESTAMP(3),
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "leadId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_quotes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" INTEGER NOT NULL,
    "companyId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "leadId" UUID,
    "status" "SalesQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "deliveryDays" INTEGER,
    "paymentTerms" TEXT,
    "shippingMethod" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discountPercent" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "discountValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "shippingValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "internalNotes" TEXT,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "convertedToOrderId" UUID,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "sales_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_quote_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quoteId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "discountPercent" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_id" INTEGER,
    "code" INTEGER NOT NULL,
    "companyId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "quoteId" UUID,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'PENDING',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "shippingMethod" TEXT,
    "shippingAddress" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discountPercent" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "discountValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "shippingValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "internalNotes" TEXT,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "trackingCode" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(15,4) NOT NULL,
    "deliveredQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "discountPercent" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "productionOrderId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_pipelines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "stages" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(100),
    "department" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(30),
    "mobile" VARCHAR(30),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "customer_id" UUID NOT NULL,
    "pipeline_id" UUID NOT NULL,
    "stage" VARCHAR(50) NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "probability" INTEGER NOT NULL DEFAULT 50,
    "expected_close_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "won_at" TIMESTAMP(3),
    "lost_at" TIMESTAMP(3),
    "lost_reason" TEXT,
    "lead_id" UUID,
    "assigned_to" UUID,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "opportunity_id" UUID,
    "channel" VARCHAR(20) NOT NULL,
    "direction" VARCHAR(10) NOT NULL,
    "subject" VARCHAR(255),
    "content" TEXT,
    "contact_name" VARCHAR(255),
    "scheduled_at" TIMESTAMP(3),
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_minutes" INTEGER,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_scoring_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "field" VARCHAR(50) NOT NULL,
    "operator" VARCHAR(20) NOT NULL,
    "value" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_scoring_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "user_id" UUID,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "target_value" DECIMAL(15,2) NOT NULL,
    "actual_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'general',
    "companyId" UUID,
    "description" TEXT,
    "updatedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clone_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sourceCompanyId" UUID NOT NULL,
    "targetCompanyId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "clonedEntityId" UUID NOT NULL,
    "clonedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clone_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "userEmail" TEXT,
    "userName" TEXT,
    "companyId" UUID,
    "companyName" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityCode" TEXT,
    "description" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "changedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestPath" TEXT,
    "requestMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutorials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "module" VARCHAR(50),
    "category" VARCHAR(50),
    "icon" VARCHAR(50),
    "order_index" INTEGER DEFAULT 0,
    "is_published" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "tutorials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "company_id" UUID,
    "type" VARCHAR(50) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT,
    "link" VARCHAR(500),
    "metadata" JSONB DEFAULT '{}',
    "is_read" BOOLEAN DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "department_id" UUID,
    "group_id" UUID,
    "target_permission" VARCHAR(100),
    "is_task" BOOLEAN DEFAULT false,
    "task_id" UUID,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "email_enabled" BOOLEAN DEFAULT true,
    "push_enabled" BOOLEAN DEFAULT true,
    "in_app_enabled" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "level" VARCHAR(10) NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB DEFAULT '{}',
    "stack" TEXT,
    "user_id" UUID,
    "company_id" UUID,
    "request_id" VARCHAR(100),
    "source" VARCHAR(100),
    "duration_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "company_id" UUID,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_group_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "added_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "added_by" UUID,

    CONSTRAINT "notification_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "layout" JSONB DEFAULT '[]',
    "filters" JSONB DEFAULT '{}',
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpis" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "unit" VARCHAR(20),
    "formula" TEXT,
    "targetMin" DECIMAL(15,2),
    "targetExpected" DECIMAL(15,2),
    "targetMax" DECIMAL(15,2),
    "polarity" VARCHAR(10) NOT NULL DEFAULT 'HIGHER',
    "frequency" VARCHAR(20) NOT NULL DEFAULT 'DAILY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_values" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kpiId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "period" DATE NOT NULL,
    "value" DECIMAL(15,4) NOT NULL,
    "target" DECIMAL(15,4),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ON_TARGET',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_widgets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dashboardId" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "position" JSONB NOT NULL DEFAULT '{"h": 2, "w": 4, "x": 0, "y": 0}',
    "kpiId" UUID,
    "dataSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "reportType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "was_fallback" BOOLEAN NOT NULL DEFAULT false,
    "fallback_from" TEXT,
    "user_id" UUID,
    "request_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "secret" VARCHAR(255) NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "webhook_status" NOT NULL DEFAULT 'ACTIVE',
    "headers" JSONB DEFAULT '{}',
    "description" TEXT,
    "timeout_ms" INTEGER NOT NULL DEFAULT 10000,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100),
    "entity_id" UUID,
    "payload" JSONB NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "webhook_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "status" "webhook_delivery_status" NOT NULL DEFAULT 'PENDING',
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "request_url" VARCHAR(2048) NOT NULL,
    "request_headers" JSONB,
    "request_body" TEXT,
    "response_status" INTEGER,
    "response_body" TEXT,
    "duration_ms" INTEGER,
    "error_message" TEXT,
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" SERIAL NOT NULL,
    "company_id" UUID,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "priority" "task_priority" DEFAULT 'NORMAL',
    "status" "task_status" DEFAULT 'PENDING',
    "target_type" VARCHAR(50) NOT NULL,
    "target_user_id" UUID,
    "target_department_id" UUID,
    "target_group_id" UUID,
    "target_permission" VARCHAR(100),
    "owner_id" UUID,
    "accepted_at" TIMESTAMPTZ(6),
    "deadline" TIMESTAMPTZ(6),
    "sla_accept_hours" INTEGER DEFAULT 24,
    "sla_resolve_hours" INTEGER DEFAULT 72,
    "entity_type" "task_entity_type",
    "entity_id" UUID,
    "notification_id" UUID,
    "resolution" TEXT,
    "completed_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "old_status" "task_status",
    "new_status" "task_status",
    "old_owner_id" UUID,
    "new_owner_id" UUID,
    "comment" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "description" TEXT,
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "triggerType" VARCHAR(50) NOT NULL,
    "triggerConfig" JSONB DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "canvasLayout" JSONB,
    "formSchema" JSONB,
    "variables" JSONB DEFAULT '[]',

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "definitionId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB DEFAULT '{}',
    "assigneeType" VARCHAR(50),
    "assigneeId" UUID,
    "assigneeExpression" TEXT,
    "slaHours" INTEGER,
    "escalationUserId" UUID,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "positionX" DOUBLE PRECISION DEFAULT 0,
    "positionY" DOUBLE PRECISION DEFAULT 0,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "style" JSONB,
    "formFields" JSONB,
    "validationRules" JSONB,
    "scriptCode" TEXT,
    "serviceEndpoint" TEXT,
    "serviceMethod" VARCHAR(10),

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_transitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "definitionId" UUID NOT NULL,
    "fromStepId" UUID NOT NULL,
    "toStepId" UUID NOT NULL,
    "condition" TEXT,
    "conditionType" VARCHAR(50) DEFAULT 'ALWAYS',
    "label" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conditionJson" JSONB,
    "sourceHandle" VARCHAR(50),
    "targetHandle" VARCHAR(50),
    "edgeType" VARCHAR(50) DEFAULT 'default',
    "edgeStyle" JSONB,
    "labelPosition" DOUBLE PRECISION DEFAULT 0.5,
    "isDefault" BOOLEAN DEFAULT false,
    "priority" INTEGER DEFAULT 0,

    CONSTRAINT "workflow_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "definitionId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "currentStepId" UUID,
    "entityType" VARCHAR(100),
    "entityId" UUID,
    "data" JSONB DEFAULT '{}',
    "startedBy" UUID,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" UUID,
    "cancellationReason" TEXT,
    "context" JSONB DEFAULT '{}',
    "variables" JSONB DEFAULT '{}',
    "activeTokens" JSONB DEFAULT '[]',
    "priority" INTEGER DEFAULT 0,
    "dueDate" TIMESTAMPTZ(6),

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_step_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instanceId" UUID NOT NULL,
    "stepId" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "action" VARCHAR(50),
    "assignedTo" UUID,
    "completedBy" UUID,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "comments" TEXT,
    "data" JSONB DEFAULT '{}',

    CONSTRAINT "workflow_step_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_legacy_id_key" ON "companies"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "company_onboarding_company_id_key" ON "company_onboarding"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- CreateIndex
CREATE INDEX "idx_user_companies_company" ON "user_companies"("companyId");

-- CreateIndex
CREATE INDEX "idx_user_companies_user" ON "user_companies"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_companies_userId_companyId_key" ON "user_companies"("userId", "companyId");

-- CreateIndex
CREATE INDEX "idx_user_company_permissions_companyId" ON "user_company_permissions"("companyId");

-- CreateIndex
CREATE INDEX "user_company_permissions_userId_idx" ON "user_company_permissions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_company_permissions_userId_companyId_module_key" ON "user_company_permissions"("userId", "companyId", "module");

-- CreateIndex
CREATE INDEX "idx_user_groups_companyId" ON "user_groups"("companyId");

-- CreateIndex
CREATE INDEX "idx_user_group_members_groupId" ON "user_group_members"("groupId");

-- CreateIndex
CREATE INDEX "user_group_members_addedBy_idx" ON "user_group_members"("addedBy");

-- CreateIndex
CREATE INDEX "user_group_members_userId_idx" ON "user_group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_group_members_userId_groupId_key" ON "user_group_members"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_company_id_idx" ON "api_keys"("company_id");

-- CreateIndex
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_slug_key" ON "product_categories"("slug");

-- CreateIndex
CREATE INDEX "idx_product_categories_company" ON "product_categories"("company_id");

-- CreateIndex
CREATE INDEX "idx_product_categories_parent" ON "product_categories"("parent_id");

-- CreateIndex
CREATE INDEX "idx_product_categories_slug" ON "product_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_definitions_key_key" ON "attribute_definitions"("key");

-- CreateIndex
CREATE INDEX "idx_attribute_definitions_company" ON "attribute_definitions"("company_id");

-- CreateIndex
CREATE INDEX "idx_attribute_definitions_key" ON "attribute_definitions"("key");

-- CreateIndex
CREATE INDEX "idx_category_attributes_category" ON "category_attributes"("category_id");

-- CreateIndex
CREATE INDEX "idx_category_attributes_attribute" ON "category_attributes"("attribute_id");

-- CreateIndex
CREATE INDEX "idx_category_attributes_company" ON "category_attributes"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_legacy_id_key" ON "products"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "idx_products_company" ON "products"("company_id");

-- CreateIndex
CREATE INDEX "idx_products_material" ON "products"("material_id");

-- CreateIndex
CREATE INDEX "idx_products_published" ON "products"("is_published");

-- CreateIndex
CREATE INDEX "idx_products_slug" ON "products"("slug");

-- CreateIndex
CREATE INDEX "idx_products_status" ON "products"("status");

-- CreateIndex
CREATE INDEX "idx_product_images_primary" ON "product_images"("is_primary");

-- CreateIndex
CREATE INDEX "idx_product_images_product" ON "product_images"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_videos_product" ON "product_videos"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_videos_type" ON "product_videos"("type");

-- CreateIndex
CREATE INDEX "idx_product_attachments_product" ON "product_attachments"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_attachments_type" ON "product_attachments"("type");

-- CreateIndex
CREATE INDEX "ged_documents_companyId_idx" ON "ged_documents"("companyId");

-- CreateIndex
CREATE INDEX "ged_documents_categoryId_idx" ON "ged_documents"("categoryId");

-- CreateIndex
CREATE INDEX "ged_documents_entityType_entityId_idx" ON "ged_documents"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ged_documents_status_idx" ON "ged_documents"("status");

-- CreateIndex
CREATE INDEX "ged_documents_parentId_idx" ON "ged_documents"("parentId");

-- CreateIndex
CREATE INDEX "ged_documents_tags_idx" ON "ged_documents" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "ged_categories_companyId_idx" ON "ged_categories"("companyId");

-- CreateIndex
CREATE INDEX "ged_categories_parentId_idx" ON "ged_categories"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ged_categories_companyId_name_key" ON "ged_categories"("companyId", "name");

-- CreateIndex
CREATE INDEX "ged_access_logs_documentId_idx" ON "ged_access_logs"("documentId");

-- CreateIndex
CREATE INDEX "ged_access_logs_userId_idx" ON "ged_access_logs"("userId");

-- CreateIndex
CREATE INDEX "ged_access_logs_createdAt_idx" ON "ged_access_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "esocial_configs_company_id_key" ON "esocial_configs"("company_id");

-- CreateIndex
CREATE INDEX "esocial_rubrics_company_id_idx" ON "esocial_rubrics"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "esocial_rubrics_company_id_code_key" ON "esocial_rubrics"("company_id", "code");

-- CreateIndex
CREATE INDEX "esocial_batches_company_id_idx" ON "esocial_batches"("company_id");

-- CreateIndex
CREATE INDEX "esocial_batches_company_id_group_type_idx" ON "esocial_batches"("company_id", "group_type");

-- CreateIndex
CREATE UNIQUE INDEX "esocial_batches_company_id_batch_number_key" ON "esocial_batches"("company_id", "batch_number");

-- CreateIndex
CREATE INDEX "esocial_events_company_id_idx" ON "esocial_events"("company_id");

-- CreateIndex
CREATE INDEX "esocial_events_company_id_reference_year_reference_month_idx" ON "esocial_events"("company_id", "reference_year", "reference_month");

-- CreateIndex
CREATE INDEX "esocial_events_employee_id_idx" ON "esocial_events"("employee_id");

-- CreateIndex
CREATE INDEX "esocial_events_batch_id_idx" ON "esocial_events"("batch_id");

-- CreateIndex
CREATE INDEX "esocial_events_source_entity_type_source_entity_id_idx" ON "esocial_events"("source_entity_type", "source_entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "esocial_events_company_id_sequence_number_key" ON "esocial_events"("company_id", "sequence_number");

-- CreateIndex
CREATE INDEX "categories_companyId_idx" ON "categories"("companyId");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE INDEX "accounts_payable_invoiceId_idx" ON "accounts_payable"("invoiceId");

-- CreateIndex
CREATE INDEX "idx_accounts_payable_bankaccount" ON "accounts_payable"("bankAccountId");

-- CreateIndex
CREATE INDEX "idx_accounts_payable_companyId" ON "accounts_payable"("companyId");

-- CreateIndex
CREATE INDEX "idx_accounts_payable_costcenter" ON "accounts_payable"("costCenterId");

-- CreateIndex
CREATE INDEX "idx_accounts_payable_supplierId" ON "accounts_payable"("supplierId");

-- CreateIndex
CREATE INDEX "accounts_payable_companyId_status_idx" ON "accounts_payable"("companyId", "status");

-- CreateIndex
CREATE INDEX "accounts_payable_companyId_dueDate_idx" ON "accounts_payable"("companyId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_payable_companyId_code_key" ON "accounts_payable"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_payable_companyId_legacy_id_key" ON "accounts_payable"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "payable_payments_payableId_idx" ON "payable_payments"("payableId");

-- CreateIndex
CREATE INDEX "payable_payments_paymentDate_idx" ON "payable_payments"("paymentDate");

-- CreateIndex
CREATE INDEX "cost_centers_companyId_idx" ON "cost_centers"("companyId");

-- CreateIndex
CREATE INDEX "cost_centers_parentId_idx" ON "cost_centers"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_code_companyId_key" ON "cost_centers"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_companyId_legacy_id_key" ON "cost_centers"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "idx_bank_accounts_companyId" ON "bank_accounts"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_code_companyId_key" ON "bank_accounts"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_companyId_legacy_id_key" ON "bank_accounts"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "bank_transactions_payableId_idx" ON "bank_transactions"("payableId");

-- CreateIndex
CREATE INDEX "bank_transactions_receivableId_idx" ON "bank_transactions"("receivableId");

-- CreateIndex
CREATE INDEX "bank_transactions_reconciled_idx" ON "bank_transactions"("reconciled");

-- CreateIndex
CREATE INDEX "idx_bank_transactions_bankAccountId" ON "bank_transactions"("bankAccountId");

-- CreateIndex
CREATE INDEX "idx_bank_transactions_transfer" ON "bank_transactions"("transferToAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "pix_transactions_transactionId_key" ON "pix_transactions"("transactionId");

-- CreateIndex
CREATE INDEX "pix_transactions_companyId_idx" ON "pix_transactions"("companyId");

-- CreateIndex
CREATE INDEX "pix_transactions_status_idx" ON "pix_transactions"("status");

-- CreateIndex
CREATE INDEX "pix_transactions_createdAt_idx" ON "pix_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "pix_transactions_pixKey_idx" ON "pix_transactions"("pixKey");

-- CreateIndex
CREATE INDEX "pix_transactions_bankAccountId_idx" ON "pix_transactions"("bankAccountId");

-- CreateIndex
CREATE INDEX "idx_accounts_receivable_bankaccount" ON "accounts_receivable"("bankAccountId");

-- CreateIndex
CREATE INDEX "idx_accounts_receivable_companyId" ON "accounts_receivable"("companyId");

-- CreateIndex
CREATE INDEX "idx_accounts_receivable_costcenter" ON "accounts_receivable"("costCenterId");

-- CreateIndex
CREATE INDEX "idx_accounts_receivable_customerId" ON "accounts_receivable"("customerId");

-- CreateIndex
CREATE INDEX "idx_accounts_receivable_issuedinvoice" ON "accounts_receivable"("issuedInvoiceId");

-- CreateIndex
CREATE INDEX "accounts_receivable_companyId_status_idx" ON "accounts_receivable"("companyId", "status");

-- CreateIndex
CREATE INDEX "accounts_receivable_companyId_dueDate_idx" ON "accounts_receivable"("companyId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_receivable_code_companyId_key" ON "accounts_receivable"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_receivable_companyId_legacy_id_key" ON "accounts_receivable"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "receivable_payments_receivableId_idx" ON "receivable_payments"("receivableId");

-- CreateIndex
CREATE INDEX "receivable_payments_paymentDate_idx" ON "receivable_payments"("paymentDate");

-- CreateIndex
CREATE INDEX "idx_receivable_payments_bank_account" ON "receivable_payments"("bankAccountId");

-- CreateIndex
CREATE INDEX "idx_receivable_payments_transaction" ON "receivable_payments"("bankTransactionId");

-- CreateIndex
CREATE INDEX "payable_approvals_payableId_idx" ON "payable_approvals"("payableId");

-- CreateIndex
CREATE INDEX "payable_approvals_approverId_idx" ON "payable_approvals"("approverId");

-- CreateIndex
CREATE INDEX "payable_approvals_status_idx" ON "payable_approvals"("status");

-- CreateIndex
CREATE INDEX "payable_attachments_payableId_idx" ON "payable_attachments"("payableId");

-- CreateIndex
CREATE INDEX "payable_cost_allocations_payableId_idx" ON "payable_cost_allocations"("payableId");

-- CreateIndex
CREATE INDEX "payable_cost_allocations_costCenterId_idx" ON "payable_cost_allocations"("costCenterId");

-- CreateIndex
CREATE INDEX "approval_thresholds_companyId_idx" ON "approval_thresholds"("companyId");

-- CreateIndex
CREATE INDEX "approval_threshold_approvers_thresholdId_idx" ON "approval_threshold_approvers"("thresholdId");

-- CreateIndex
CREATE INDEX "approval_threshold_approvers_userId_idx" ON "approval_threshold_approvers"("userId");

-- CreateIndex
CREATE INDEX "budget_accounts_companyId_idx" ON "budget_accounts"("companyId");

-- CreateIndex
CREATE INDEX "budget_accounts_parentId_idx" ON "budget_accounts"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_accounts_companyId_code_key" ON "budget_accounts"("companyId", "code");

-- CreateIndex
CREATE INDEX "budget_versions_companyId_year_idx" ON "budget_versions"("companyId", "year");

-- CreateIndex
CREATE INDEX "budget_versions_approvedBy_idx" ON "budget_versions"("approvedBy");

-- CreateIndex
CREATE INDEX "budget_versions_createdBy_idx" ON "budget_versions"("createdBy");

-- CreateIndex
CREATE INDEX "budget_versions_companyId_idx" ON "budget_versions"("companyId");

-- CreateIndex
CREATE INDEX "budget_entries_versionId_idx" ON "budget_entries"("versionId");

-- CreateIndex
CREATE INDEX "budget_entries_accountId_idx" ON "budget_entries"("accountId");

-- CreateIndex
CREATE INDEX "budget_entries_costCenterId_idx" ON "budget_entries"("costCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_entries_unique" ON "budget_entries"("versionId", "accountId", "costCenterId", "month");

-- CreateIndex
CREATE INDEX "budget_actuals_companyId_date_idx" ON "budget_actuals"("companyId", "date");

-- CreateIndex
CREATE INDEX "budget_actuals_accountId_idx" ON "budget_actuals"("accountId");

-- CreateIndex
CREATE INDEX "budget_actuals_costCenterId_idx" ON "budget_actuals"("costCenterId");

-- CreateIndex
CREATE INDEX "budget_actuals_companyId_idx" ON "budget_actuals"("companyId");

-- CreateIndex
CREATE INDEX "budget_alerts_companyId_idx" ON "budget_alerts"("companyId");

-- CreateIndex
CREATE INDEX "budget_alerts_isResolved_idx" ON "budget_alerts"("isResolved");

-- CreateIndex
CREATE INDEX "budget_alerts_accountId_idx" ON "budget_alerts"("accountId");

-- CreateIndex
CREATE INDEX "budget_alerts_costCenterId_idx" ON "budget_alerts"("costCenterId");

-- CreateIndex
CREATE INDEX "budget_alerts_resolvedBy_idx" ON "budget_alerts"("resolvedBy");

-- CreateIndex
CREATE INDEX "budget_alerts_versionId_idx" ON "budget_alerts"("versionId");

-- CreateIndex
CREATE INDEX "approval_levels_companyId_idx" ON "approval_levels"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_levels_companyId_code_key" ON "approval_levels"("companyId", "code");

-- CreateIndex
CREATE INDEX "approval_level_approvers_levelId_idx" ON "approval_level_approvers"("levelId");

-- CreateIndex
CREATE INDEX "approval_level_approvers_userId_idx" ON "approval_level_approvers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_level_approvers_levelId_userId_key" ON "approval_level_approvers"("levelId", "userId");

-- CreateIndex
CREATE INDEX "payment_requests_companyId_idx" ON "payment_requests"("companyId");

-- CreateIndex
CREATE INDEX "payment_requests_status_idx" ON "payment_requests"("status");

-- CreateIndex
CREATE INDEX "payment_requests_payableId_idx" ON "payment_requests"("payableId");

-- CreateIndex
CREATE INDEX "payment_requests_requestedBy_idx" ON "payment_requests"("requestedBy");

-- CreateIndex
CREATE INDEX "payment_requests_currentLevelId_idx" ON "payment_requests"("currentLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_requests_companyId_code_key" ON "payment_requests"("companyId", "code");

-- CreateIndex
CREATE INDEX "payment_approvals_requestId_idx" ON "payment_approvals"("requestId");

-- CreateIndex
CREATE INDEX "payment_approvals_approverId_idx" ON "payment_approvals"("approverId");

-- CreateIndex
CREATE INDEX "payment_approvals_delegatedTo_idx" ON "payment_approvals"("delegatedTo");

-- CreateIndex
CREATE INDEX "payment_approvals_levelId_idx" ON "payment_approvals"("levelId");

-- CreateIndex
CREATE INDEX "idx_dda_boletos_accounts_payable_id" ON "dda_boletos"("accounts_payable_id");

-- CreateIndex
CREATE INDEX "idx_dda_boletos_aprovado_por" ON "dda_boletos"("aprovado_por");

-- CreateIndex
CREATE INDEX "idx_dda_boletos_cedente" ON "dda_boletos"("cedente_cnpj");

-- CreateIndex
CREATE INDEX "idx_dda_boletos_codigo_barras" ON "dda_boletos"("codigo_barras");

-- CreateIndex
CREATE INDEX "idx_dda_boletos_company" ON "dda_boletos"("company_id");

-- CreateIndex
CREATE INDEX "idx_dda_boletos_created_by" ON "dda_boletos"("created_by");

-- CreateIndex
CREATE INDEX "idx_dda_boletos_status" ON "dda_boletos"("status");

-- CreateIndex
CREATE INDEX "idx_dda_boletos_supplier_id" ON "dda_boletos"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_dda_boletos_vencimento" ON "dda_boletos"("data_vencimento");

-- CreateIndex
CREATE INDEX "dda_config_company_id_idx" ON "dda_config"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "dda_config_company_id_banco_codigo_key" ON "dda_config"("company_id", "banco_codigo");

-- CreateIndex
CREATE INDEX "idx_dda_sync_log_company_id" ON "dda_sync_log"("company_id");

-- CreateIndex
CREATE INDEX "idx_dda_sync_log_config_id" ON "dda_sync_log"("config_id");

-- CreateIndex
CREATE INDEX "idx_collection_rules_active" ON "collection_rules"("is_active");

-- CreateIndex
CREATE INDEX "idx_collection_rules_company" ON "collection_rules"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_rules_company_id_legacy_id_key" ON "collection_rules"("company_id", "legacy_id");

-- CreateIndex
CREATE INDEX "idx_collection_rule_steps_rule" ON "collection_rule_steps"("collection_rule_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_rule_steps_collection_rule_id_step_order_key" ON "collection_rule_steps"("collection_rule_id", "step_order");

-- CreateIndex
CREATE INDEX "idx_collection_actions_date" ON "collection_actions"("action_date");

-- CreateIndex
CREATE INDEX "idx_collection_actions_receivable" ON "collection_actions"("receivable_id");

-- CreateIndex
CREATE INDEX "idx_collection_actions_rule" ON "collection_actions"("collection_rule_id");

-- CreateIndex
CREATE INDEX "idx_collection_actions_status" ON "collection_actions"("status");

-- CreateIndex
CREATE INDEX "idx_collection_actions_step" ON "collection_actions"("step_id");

-- CreateIndex
CREATE INDEX "chart_of_accounts_company_id_idx" ON "chart_of_accounts"("company_id");

-- CreateIndex
CREATE INDEX "chart_of_accounts_parent_id_idx" ON "chart_of_accounts"("parent_id");

-- CreateIndex
CREATE INDEX "chart_of_accounts_company_id_type_idx" ON "chart_of_accounts"("company_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_company_id_code_key" ON "chart_of_accounts"("company_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_entries_reversal_of_key" ON "accounting_entries"("reversal_of");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_entries_reversed_by_key" ON "accounting_entries"("reversed_by");

-- CreateIndex
CREATE INDEX "accounting_entries_company_id_date_idx" ON "accounting_entries"("company_id", "date");

-- CreateIndex
CREATE INDEX "accounting_entries_company_id_status_idx" ON "accounting_entries"("company_id", "status");

-- CreateIndex
CREATE INDEX "accounting_entries_document_type_document_id_idx" ON "accounting_entries"("document_type", "document_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_entries_company_id_code_key" ON "accounting_entries"("company_id", "code");

-- CreateIndex
CREATE INDEX "accounting_entry_items_entry_id_idx" ON "accounting_entry_items"("entry_id");

-- CreateIndex
CREATE INDEX "accounting_entry_items_account_id_idx" ON "accounting_entry_items"("account_id");

-- CreateIndex
CREATE INDEX "accounting_entry_items_cost_center_id_idx" ON "accounting_entry_items"("cost_center_id");

-- CreateIndex
CREATE INDEX "fixed_assets_company_id_idx" ON "fixed_assets"("company_id");

-- CreateIndex
CREATE INDEX "fixed_assets_company_id_status_idx" ON "fixed_assets"("company_id", "status");

-- CreateIndex
CREATE INDEX "fixed_assets_company_id_category_idx" ON "fixed_assets"("company_id", "category");

-- CreateIndex
CREATE INDEX "fixed_assets_responsible_id_idx" ON "fixed_assets"("responsible_id");

-- CreateIndex
CREATE INDEX "fixed_assets_cost_center_id_idx" ON "fixed_assets"("cost_center_id");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_assets_company_id_code_key" ON "fixed_assets"("company_id", "code");

-- CreateIndex
CREATE INDEX "asset_depreciations_asset_id_idx" ON "asset_depreciations"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_depreciations_asset_id_period_key" ON "asset_depreciations"("asset_id", "period");

-- CreateIndex
CREATE INDEX "asset_movements_asset_id_idx" ON "asset_movements"("asset_id");

-- CreateIndex
CREATE INDEX "asset_movements_asset_id_type_idx" ON "asset_movements"("asset_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "received_invoices_accessKey_key" ON "received_invoices"("accessKey");

-- CreateIndex
CREATE INDEX "idx_received_invoices_companyId" ON "received_invoices"("companyId");

-- CreateIndex
CREATE INDEX "idx_received_invoices_supplierId" ON "received_invoices"("supplierId");

-- CreateIndex
CREATE INDEX "received_invoices_purchaseOrderId_idx" ON "received_invoices"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "received_invoices_companyId_status_idx" ON "received_invoices"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "received_invoices_companyId_legacy_id_key" ON "received_invoices"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "idx_received_invoice_items_invoiceId" ON "received_invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "idx_received_invoice_items_materialId" ON "received_invoice_items"("materialId");

-- CreateIndex
CREATE INDEX "received_invoice_items_purchaseOrderItemId_idx" ON "received_invoice_items"("purchaseOrderItemId");

-- CreateIndex
CREATE INDEX "issued_invoices_salesOrderId_idx" ON "issued_invoices"("salesOrderId");

-- CreateIndex
CREATE INDEX "issued_invoices_issueDate_idx" ON "issued_invoices"("issueDate");

-- CreateIndex
CREATE INDEX "idx_issued_invoices_companyId" ON "issued_invoices"("companyId");

-- CreateIndex
CREATE INDEX "idx_issued_invoices_customerId" ON "issued_invoices"("customerId");

-- CreateIndex
CREATE INDEX "issued_invoices_companyId_status_idx" ON "issued_invoices"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "issued_invoices_companyId_legacy_id_key" ON "issued_invoices"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "idx_issued_invoice_items_invoiceId" ON "issued_invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "idx_issued_invoice_items_material" ON "issued_invoice_items"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "sefaz_sync_configs_companyId_key" ON "sefaz_sync_configs"("companyId");

-- CreateIndex
CREATE INDEX "sefaz_sync_logs_companyId_idx" ON "sefaz_sync_logs"("companyId");

-- CreateIndex
CREATE INDEX "sefaz_sync_logs_status_idx" ON "sefaz_sync_logs"("status");

-- CreateIndex
CREATE INDEX "sefaz_sync_logs_startedAt_idx" ON "sefaz_sync_logs"("startedAt");

-- CreateIndex
CREATE INDEX "sefaz_pending_nfes_situacao_idx" ON "sefaz_pending_nfes"("situacao");

-- CreateIndex
CREATE INDEX "sefaz_pending_nfes_chaveAcesso_idx" ON "sefaz_pending_nfes"("chaveAcesso");

-- CreateIndex
CREATE INDEX "idx_sefaz_pending_nfes_companyId" ON "sefaz_pending_nfes"("companyId");

-- CreateIndex
CREATE INDEX "sefaz_pending_nfes_receivedInvoiceId_idx" ON "sefaz_pending_nfes"("receivedInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "sefaz_pending_nfes_companyId_chaveAcesso_key" ON "sefaz_pending_nfes"("companyId", "chaveAcesso");

-- CreateIndex
CREATE INDEX "idx_sefaz_manifestacao_logs_chave" ON "sefaz_manifestacao_logs"("chaveAcesso");

-- CreateIndex
CREATE INDEX "idx_sefaz_manifestacao_logs_company" ON "sefaz_manifestacao_logs"("companyId");

-- CreateIndex
CREATE INDEX "idx_sefaz_manifestacao_logs_data" ON "sefaz_manifestacao_logs"("dataManifestacao");

-- CreateIndex
CREATE INDEX "idx_sefaz_manifestacao_logs_pendingNfeId" ON "sefaz_manifestacao_logs"("pendingNfeId");

-- CreateIndex
CREATE INDEX "idx_sefaz_manifestacao_logs_tipo" ON "sefaz_manifestacao_logs"("tipo");

-- CreateIndex
CREATE INDEX "idx_import_documents_process" ON "import_documents"("import_process_id");

-- CreateIndex
CREATE INDEX "idx_nfe_queue_jobs_company_id" ON "nfe_queue_jobs"("company_id");

-- CreateIndex
CREATE INDEX "idx_nfe_queue_jobs_nfe_id" ON "nfe_queue_jobs"("nfe_id");

-- CreateIndex
CREATE INDEX "idx_nfe_queue_jobs_status" ON "nfe_queue_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tax_regimes_code_key" ON "tax_regimes"("code");

-- CreateIndex
CREATE INDEX "fiscal_obligations_company_id_idx" ON "fiscal_obligations"("company_id");

-- CreateIndex
CREATE INDEX "fiscal_obligations_company_id_status_idx" ON "fiscal_obligations"("company_id", "status");

-- CreateIndex
CREATE INDEX "fiscal_obligations_due_date_idx" ON "fiscal_obligations"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_obligations_company_id_type_year_month_key" ON "fiscal_obligations"("company_id", "type", "year", "month");

-- CreateIndex
CREATE INDEX "tax_apurations_company_id_idx" ON "tax_apurations"("company_id");

-- CreateIndex
CREATE INDEX "tax_apurations_company_id_tax_type_idx" ON "tax_apurations"("company_id", "tax_type");

-- CreateIndex
CREATE INDEX "tax_apurations_company_id_status_idx" ON "tax_apurations"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tax_apurations_company_id_tax_type_year_month_key" ON "tax_apurations"("company_id", "tax_type", "year", "month");

-- CreateIndex
CREATE INDEX "tax_apuration_items_apuration_id_idx" ON "tax_apuration_items"("apuration_id");

-- CreateIndex
CREATE UNIQUE INDEX "nfse_configs_company_id_key" ON "nfse_configs"("company_id");

-- CreateIndex
CREATE INDEX "nfse_issued_company_id_idx" ON "nfse_issued"("company_id");

-- CreateIndex
CREATE INDEX "nfse_issued_company_id_status_idx" ON "nfse_issued"("company_id", "status");

-- CreateIndex
CREATE INDEX "nfse_issued_customer_id_idx" ON "nfse_issued"("customer_id");

-- CreateIndex
CREATE INDEX "nfse_issued_competence_date_idx" ON "nfse_issued"("competence_date");

-- CreateIndex
CREATE UNIQUE INDEX "nfse_issued_company_id_code_key" ON "nfse_issued"("company_id", "code");

-- CreateIndex
CREATE INDEX "difal_calculations_company_id_idx" ON "difal_calculations"("company_id");

-- CreateIndex
CREATE INDEX "difal_calculations_company_id_uf_origem_uf_destino_idx" ON "difal_calculations"("company_id", "uf_origem", "uf_destino");

-- CreateIndex
CREATE INDEX "bloco_k_records_company_id_idx" ON "bloco_k_records"("company_id");

-- CreateIndex
CREATE INDEX "bloco_k_records_company_id_year_month_idx" ON "bloco_k_records"("company_id", "year", "month");

-- CreateIndex
CREATE INDEX "bloco_k_records_material_id_idx" ON "bloco_k_records"("material_id");

-- CreateIndex
CREATE INDEX "strategic_goals_companyId_idx" ON "strategic_goals"("companyId");

-- CreateIndex
CREATE INDEX "strategic_goals_year_idx" ON "strategic_goals"("year");

-- CreateIndex
CREATE INDEX "strategic_goals_parentId_idx" ON "strategic_goals"("parentId");

-- CreateIndex
CREATE INDEX "strategic_goals_departmentId_idx" ON "strategic_goals"("departmentId");

-- CreateIndex
CREATE INDEX "strategic_goals_ownerId_idx" ON "strategic_goals"("ownerId");

-- CreateIndex
CREATE INDEX "goal_indicators_goalId_idx" ON "goal_indicators"("goalId");

-- CreateIndex
CREATE INDEX "goal_indicators_companyId_idx" ON "goal_indicators"("companyId");

-- CreateIndex
CREATE INDEX "indicator_history_indicatorId_idx" ON "indicator_history"("indicatorId");

-- CreateIndex
CREATE INDEX "indicator_history_period_idx" ON "indicator_history"("period");

-- CreateIndex
CREATE UNIQUE INDEX "indicator_history_indicatorId_period_key" ON "indicator_history"("indicatorId", "period");

-- CreateIndex
CREATE INDEX "action_plans_companyId_idx" ON "action_plans"("companyId");

-- CreateIndex
CREATE INDEX "action_plans_goalId_idx" ON "action_plans"("goalId");

-- CreateIndex
CREATE INDEX "action_plans_status_idx" ON "action_plans"("status");

-- CreateIndex
CREATE INDEX "action_plans_createdBy_idx" ON "action_plans"("createdBy");

-- CreateIndex
CREATE INDEX "action_plans_indicatorId_idx" ON "action_plans"("indicatorId");

-- CreateIndex
CREATE INDEX "action_plans_responsibleId_idx" ON "action_plans"("responsibleId");

-- CreateIndex
CREATE INDEX "action_plan_tasks_actionPlanId_idx" ON "action_plan_tasks"("actionPlanId");

-- CreateIndex
CREATE INDEX "action_plan_tasks_responsibleId_idx" ON "action_plan_tasks"("responsibleId");

-- CreateIndex
CREATE INDEX "idx_departments_companyId" ON "departments"("companyId");

-- CreateIndex
CREATE INDEX "idx_departments_costcenter" ON "departments"("costCenterId");

-- CreateIndex
CREATE INDEX "idx_departments_parent" ON "departments"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_companyId_key" ON "departments"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_companyId_legacy_id_key" ON "departments"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "idx_job_positions_companyId" ON "job_positions"("companyId");

-- CreateIndex
CREATE INDEX "idx_job_positions_department" ON "job_positions"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "job_positions_code_companyId_key" ON "job_positions"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "job_positions_companyId_legacy_id_key" ON "job_positions"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "idx_employees_companyId" ON "employees"("companyId");

-- CreateIndex
CREATE INDEX "idx_employees_departmentId" ON "employees"("departmentId");

-- CreateIndex
CREATE INDEX "idx_employees_manager" ON "employees"("managerId");

-- CreateIndex
CREATE INDEX "idx_employees_position" ON "employees"("positionId");

-- CreateIndex
CREATE INDEX "idx_employees_user" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_companyId_code_idx" ON "employees"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_code_companyId_key" ON "employees"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_companyId_legacy_id_key" ON "employees"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "time_clock_entries_timestamp_idx" ON "time_clock_entries"("timestamp");

-- CreateIndex
CREATE INDEX "idx_time_clock_entries_approved_by" ON "time_clock_entries"("approvedBy");

-- CreateIndex
CREATE INDEX "idx_time_clock_entries_employee" ON "time_clock_entries"("employeeId");

-- CreateIndex
CREATE INDEX "timesheet_days_date_idx" ON "timesheet_days"("date");

-- CreateIndex
CREATE INDEX "idx_timesheet_days_employee" ON "timesheet_days"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "timesheet_days_employee_date_key" ON "timesheet_days"("employeeId", "date");

-- CreateIndex
CREATE INDEX "idx_work_schedules_companyId" ON "work_schedules"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedules_companyId_code_key" ON "work_schedules"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedules_companyId_legacy_id_key" ON "work_schedules"("companyId", "legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_shifts_scheduleId_dayOfWeek_key" ON "work_shifts"("scheduleId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "idx_employee_schedules_scheduleId" ON "employee_schedules"("scheduleId");

-- CreateIndex
CREATE INDEX "idx_hours_bank_companyId" ON "hours_bank"("companyId");

-- CreateIndex
CREATE INDEX "idx_hours_bank_employeeId" ON "hours_bank"("employeeId");

-- CreateIndex
CREATE INDEX "idx_time_clock_adjustments_companyId" ON "time_clock_adjustments"("companyId");

-- CreateIndex
CREATE INDEX "idx_time_clock_adjustments_employeeId" ON "time_clock_adjustments"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_legacy_id_key" ON "holidays"("legacy_id");

-- CreateIndex
CREATE INDEX "idx_holidays_companyId" ON "holidays"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_companyId_date_key" ON "holidays"("companyId", "date");

-- CreateIndex
CREATE INDEX "payrolls_companyId_idx" ON "payrolls"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_code_companyId_key" ON "payrolls"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_company_month_year_key" ON "payrolls"("companyId", "referenceMonth", "referenceYear");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_companyId_legacy_id_key" ON "payrolls"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "payroll_items_payrollId_idx" ON "payroll_items"("payrollId");

-- CreateIndex
CREATE INDEX "idx_payroll_items_employeeId" ON "payroll_items"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_items_payroll_employee_key" ON "payroll_items"("payrollId", "employeeId");

-- CreateIndex
CREATE INDEX "payroll_events_payrollItemId_idx" ON "payroll_events"("payrollItemId");

-- CreateIndex
CREATE INDEX "vacations_startDate_idx" ON "vacations"("startDate");

-- CreateIndex
CREATE INDEX "idx_vacations_companyId" ON "vacations"("companyId");

-- CreateIndex
CREATE INDEX "idx_vacations_employeeId" ON "vacations"("employeeId");

-- CreateIndex
CREATE INDEX "idx_thirteenth_salaries_companyId" ON "thirteenth_salaries"("companyId");

-- CreateIndex
CREATE INDEX "idx_thirteenth_salaries_employeeId" ON "thirteenth_salaries"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "thirteenth_salaries_employeeId_year_type_key" ON "thirteenth_salaries"("employeeId", "year", "type");

-- CreateIndex
CREATE INDEX "idx_terminations_companyId" ON "terminations"("companyId");

-- CreateIndex
CREATE INDEX "idx_terminations_employeeId" ON "terminations"("employeeId");

-- CreateIndex
CREATE INDEX "idx_benefit_types_company_id" ON "benefit_types"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "benefit_types_company_id_legacy_id_key" ON "benefit_types"("company_id", "legacy_id");

-- CreateIndex
CREATE INDEX "idx_employee_benefits_benefit_type_id" ON "employee_benefits"("benefit_type_id");

-- CreateIndex
CREATE INDEX "idx_employee_benefits_employee_id" ON "employee_benefits"("employee_id");

-- CreateIndex
CREATE INDEX "idx_employee_benefits_company_id" ON "employee_benefits"("company_id");

-- CreateIndex
CREATE INDEX "idx_transport_vouchers_employee_id" ON "transport_vouchers"("employee_id");

-- CreateIndex
CREATE INDEX "idx_transport_vouchers_company_id" ON "transport_vouchers"("company_id");

-- CreateIndex
CREATE INDEX "idx_trainings_company_id" ON "trainings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "trainings_company_id_legacy_id_key" ON "trainings"("company_id", "legacy_id");

-- CreateIndex
CREATE INDEX "idx_employee_trainings_employee_id" ON "employee_trainings"("employee_id");

-- CreateIndex
CREATE INDEX "idx_employee_trainings_training_id" ON "employee_trainings"("training_id");

-- CreateIndex
CREATE INDEX "idx_employee_trainings_company_id" ON "employee_trainings"("company_id");

-- CreateIndex
CREATE INDEX "idx_skill_matrix_employee_id" ON "skill_matrix"("employee_id");

-- CreateIndex
CREATE INDEX "idx_skill_matrix_company_id" ON "skill_matrix"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "admission_processes_access_token_key" ON "admission_processes"("access_token");

-- CreateIndex
CREATE INDEX "idx_admission_processes_company_id" ON "admission_processes"("company_id");

-- CreateIndex
CREATE INDEX "idx_admission_processes_status" ON "admission_processes"("status");

-- CreateIndex
CREATE INDEX "idx_admission_steps_admission_id" ON "admission_steps"("admission_id");

-- CreateIndex
CREATE INDEX "idx_admission_documents_admission_id" ON "admission_documents"("admission_id");

-- CreateIndex
CREATE INDEX "idx_admission_exams_admission_id" ON "admission_exams"("admission_id");

-- CreateIndex
CREATE INDEX "idx_employee_dependents_employee_id" ON "employee_dependents"("employee_id");

-- CreateIndex
CREATE INDEX "idx_employee_dependents_company_id" ON "employee_dependents"("company_id");

-- CreateIndex
CREATE INDEX "idx_leave_records_employee_id" ON "leave_records"("employee_id");

-- CreateIndex
CREATE INDEX "idx_leave_records_company_id" ON "leave_records"("company_id");

-- CreateIndex
CREATE INDEX "idx_leave_records_start_date" ON "leave_records"("start_date");

-- CreateIndex
CREATE INDEX "idx_income_tax_table_year" ON "income_tax_tables"("year");

-- CreateIndex
CREATE UNIQUE INDEX "uq_income_tax_table_range" ON "income_tax_tables"("year", "month", "min_value");

-- CreateIndex
CREATE INDEX "idx_inss_table_year" ON "inss_tables"("year");

-- CreateIndex
CREATE UNIQUE INDEX "uq_inss_table_range" ON "inss_tables"("year", "month", "min_value");

-- CreateIndex
CREATE UNIQUE INDEX "ports_code_key" ON "ports"("code");

-- CreateIndex
CREATE INDEX "idx_ports_company" ON "ports"("companyId");

-- CreateIndex
CREATE INDEX "idx_ports_country" ON "ports"("country");

-- CreateIndex
CREATE INDEX "idx_ports_type" ON "ports"("type");

-- CreateIndex
CREATE UNIQUE INDEX "customs_brokers_cnpj_key" ON "customs_brokers"("cnpj");

-- CreateIndex
CREATE INDEX "idx_customs_brokers_company" ON "customs_brokers"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_types_code_key" ON "cargo_types"("code");

-- CreateIndex
CREATE INDEX "idx_cargo_types_company" ON "cargo_types"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "incoterms_code_key" ON "incoterms"("code");

-- CreateIndex
CREATE INDEX "idx_incoterms_company" ON "incoterms"("companyId");

-- CreateIndex
CREATE INDEX "idx_import_processes_broker" ON "import_processes"("broker_id");

-- CreateIndex
CREATE INDEX "idx_import_processes_cargo_type" ON "import_processes"("cargo_type_id");

-- CreateIndex
CREATE INDEX "idx_import_processes_company" ON "import_processes"("company_id");

-- CreateIndex
CREATE INDEX "idx_import_processes_dates" ON "import_processes"("eta", "etd");

-- CreateIndex
CREATE INDEX "idx_import_processes_dest_port" ON "import_processes"("destination_port_id");

-- CreateIndex
CREATE INDEX "idx_import_processes_incoterm" ON "import_processes"("incoterm_id");

-- CreateIndex
CREATE INDEX "idx_import_processes_origin_port" ON "import_processes"("origin_port_id");

-- CreateIndex
CREATE INDEX "idx_import_processes_status" ON "import_processes"("status");

-- CreateIndex
CREATE INDEX "idx_import_processes_supplier" ON "import_processes"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_process_number" ON "import_processes"("process_number", "company_id");

-- CreateIndex
CREATE INDEX "idx_import_process_items_material" ON "import_process_items"("material_id");

-- CreateIndex
CREATE INDEX "idx_import_process_items_process" ON "import_process_items"("import_process_id");

-- CreateIndex
CREATE INDEX "idx_import_process_items_purchase_order" ON "import_process_items"("purchase_order_id");

-- CreateIndex
CREATE INDEX "idx_import_process_events_process" ON "import_process_events"("import_process_id");

-- CreateIndex
CREATE INDEX "idx_import_process_events_date" ON "import_process_events"("event_date");

-- CreateIndex
CREATE INDEX "idx_import_process_costs_process" ON "import_process_costs"("import_process_id");

-- CreateIndex
CREATE INDEX "idx_exchange_contracts_bank" ON "exchange_contracts"("bank_account_id");

-- CreateIndex
CREATE INDEX "idx_exchange_contracts_company" ON "exchange_contracts"("company_id");

-- CreateIndex
CREATE INDEX "idx_exchange_contracts_maturity" ON "exchange_contracts"("maturity_date");

-- CreateIndex
CREATE INDEX "idx_exchange_contracts_process" ON "exchange_contracts"("process_id");

-- CreateIndex
CREATE INDEX "idx_exchange_contracts_status" ON "exchange_contracts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "unique_contract_number_company" ON "exchange_contracts"("contract_number", "company_id");

-- CreateIndex
CREATE INDEX "idx_exchange_liquidations_contract" ON "exchange_liquidations"("contract_id");

-- CreateIndex
CREATE INDEX "idx_exchange_liquidations_date" ON "exchange_liquidations"("liquidation_date");

-- CreateIndex
CREATE UNIQUE INDEX "materials_code_key" ON "materials"("code");

-- CreateIndex
CREATE INDEX "idx_materials_companyId" ON "materials"("companyId");

-- CreateIndex
CREATE INDEX "materials_categoryId_idx" ON "materials"("categoryId");

-- CreateIndex
CREATE INDEX "materials_companyId_code_idx" ON "materials"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "materials_companyId_legacy_id_key" ON "materials"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "idx_inventory_companyId" ON "inventory"("companyId");

-- CreateIndex
CREATE INDEX "idx_inventory_version" ON "inventory"("id", "version");

-- CreateIndex
CREATE INDEX "inventory_companyId_materialId_idx" ON "inventory"("companyId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_materialId_companyId_inventoryType_key" ON "inventory"("materialId", "companyId", "inventoryType");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_companyId_legacy_id_key" ON "inventory"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "inventory_movements_inventoryId_movementDate_idx" ON "inventory_movements"("inventoryId", "movementDate");

-- CreateIndex
CREATE INDEX "inventory_movements_supplierId_idx" ON "inventory_movements"("supplierId");

-- CreateIndex
CREATE INDEX "inventory_movements_userId_idx" ON "inventory_movements"("userId");

-- CreateIndex
CREATE INDEX "stock_reservations_materialId_status_idx" ON "stock_reservations"("materialId", "status");

-- CreateIndex
CREATE INDEX "stock_reservations_documentType_documentId_idx" ON "stock_reservations"("documentType", "documentId");

-- CreateIndex
CREATE INDEX "idx_stock_reservations_inventory" ON "stock_reservations"("inventoryId");

-- CreateIndex
CREATE INDEX "stock_reservations_companyId_idx" ON "stock_reservations"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_reservations_companyId_code_key" ON "stock_reservations"("companyId", "code");

-- CreateIndex
CREATE INDEX "stock_locations_companyId_idx" ON "stock_locations"("companyId");

-- CreateIndex
CREATE INDEX "stock_locations_type_idx" ON "stock_locations"("type");

-- CreateIndex
CREATE INDEX "idx_stock_locations_parent" ON "stock_locations"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_locations_code_companyId_key" ON "stock_locations"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_locations_companyId_legacy_id_key" ON "stock_locations"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "idx_location_inventory_location" ON "location_inventory"("locationId");

-- CreateIndex
CREATE INDEX "idx_location_inventory_material" ON "location_inventory"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "location_inventory_location_material_key" ON "location_inventory"("locationId", "materialId");

-- CreateIndex
CREATE INDEX "stock_transfers_companyId_idx" ON "stock_transfers"("companyId");

-- CreateIndex
CREATE INDEX "stock_transfers_status_idx" ON "stock_transfers"("status");

-- CreateIndex
CREATE INDEX "idx_stock_transfers_approved_by" ON "stock_transfers"("approvedBy");

-- CreateIndex
CREATE INDEX "idx_stock_transfers_from_location" ON "stock_transfers"("fromLocationId");

-- CreateIndex
CREATE INDEX "idx_stock_transfers_received_by" ON "stock_transfers"("receivedBy");

-- CreateIndex
CREATE INDEX "idx_stock_transfers_requested_by" ON "stock_transfers"("requestedBy");

-- CreateIndex
CREATE INDEX "idx_stock_transfers_shipped_by" ON "stock_transfers"("shippedBy");

-- CreateIndex
CREATE INDEX "idx_stock_transfers_to_location" ON "stock_transfers"("toLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfers_code_companyId_key" ON "stock_transfers"("code", "companyId");

-- CreateIndex
CREATE INDEX "stock_transfer_items_transferId_idx" ON "stock_transfer_items"("transferId");

-- CreateIndex
CREATE INDEX "idx_stock_transfer_items_material" ON "stock_transfer_items"("materialId");

-- CreateIndex
CREATE INDEX "physical_inventories_companyId_idx" ON "physical_inventories"("companyId");

-- CreateIndex
CREATE INDEX "physical_inventories_status_idx" ON "physical_inventories"("status");

-- CreateIndex
CREATE INDEX "idx_physical_inventories_location" ON "physical_inventories"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "physical_inventories_code_companyId_key" ON "physical_inventories"("code", "companyId");

-- CreateIndex
CREATE INDEX "inventory_counts_inventoryId_idx" ON "inventory_counts"("inventoryId");

-- CreateIndex
CREATE INDEX "inventory_counts_materialId_idx" ON "inventory_counts"("materialId");

-- CreateIndex
CREATE INDEX "idx_inventory_counts_location" ON "inventory_counts"("locationId");

-- CreateIndex
CREATE INDEX "idx_lots_material_id" ON "lots"("material_id");

-- CreateIndex
CREATE INDEX "idx_lots_company_id" ON "lots"("company_id");

-- CreateIndex
CREATE INDEX "idx_lots_status" ON "lots"("status");

-- CreateIndex
CREATE INDEX "idx_lots_expiration_date" ON "lots"("expiration_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_lots_code_company" ON "lots"("code", "company_id");

-- CreateIndex
CREATE INDEX "idx_lot_movements_lot_id" ON "lot_movements"("lot_id");

-- CreateIndex
CREATE INDEX "idx_lot_movements_created_at" ON "lot_movements"("created_at");

-- CreateIndex
CREATE INDEX "idx_intercompany_transfers_source" ON "intercompany_transfers"("source_company_id");

-- CreateIndex
CREATE INDEX "idx_intercompany_transfers_target" ON "intercompany_transfers"("target_company_id");

-- CreateIndex
CREATE INDEX "idx_intercompany_transfers_status" ON "intercompany_transfers"("status");

-- CreateIndex
CREATE INDEX "idx_intercompany_transfer_items_transfer" ON "intercompany_transfer_items"("transfer_id");

-- CreateIndex
CREATE INDEX "idx_intercompany_transfer_items_material" ON "intercompany_transfer_items"("material_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_equipment_company" ON "maintenance_equipment"("company_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_equipment_work_center" ON "maintenance_equipment"("work_center_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_equipment_parent" ON "maintenance_equipment"("parent_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_equipment_criticality" ON "maintenance_equipment"("criticality");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_equipment_company_id_code_key" ON "maintenance_equipment"("company_id", "code");

-- CreateIndex
CREATE INDEX "idx_maintenance_plans_company" ON "maintenance_plans"("company_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_plans_equipment" ON "maintenance_plans"("equipment_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_plans_next_due" ON "maintenance_plans"("next_due_date");

-- CreateIndex
CREATE INDEX "idx_maintenance_plans_active" ON "maintenance_plans"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_plans_company_id_code_key" ON "maintenance_plans"("company_id", "code");

-- CreateIndex
CREATE INDEX "idx_maintenance_orders_company" ON "maintenance_orders"("company_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_orders_equipment" ON "maintenance_orders"("equipment_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_orders_plan" ON "maintenance_orders"("plan_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_orders_status" ON "maintenance_orders"("status");

-- CreateIndex
CREATE INDEX "idx_maintenance_orders_type" ON "maintenance_orders"("type");

-- CreateIndex
CREATE INDEX "idx_maintenance_orders_priority" ON "maintenance_orders"("priority");

-- CreateIndex
CREATE INDEX "idx_maintenance_orders_assigned" ON "maintenance_orders"("assigned_to");

-- CreateIndex
CREATE INDEX "maintenance_orders_company_id_status_idx" ON "maintenance_orders"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_orders_company_id_code_key" ON "maintenance_orders"("company_id", "code");

-- CreateIndex
CREATE INDEX "idx_maintenance_order_parts_order" ON "maintenance_order_parts"("order_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_order_parts_material" ON "maintenance_order_parts"("material_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_order_labor_order" ON "maintenance_order_labor"("order_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_order_labor_employee" ON "maintenance_order_labor"("employee_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_checklist_order" ON "maintenance_checklists"("order_id");

-- CreateIndex
CREATE INDEX "idx_failure_codes_company" ON "failure_codes"("company_id");

-- CreateIndex
CREATE INDEX "idx_failure_codes_category" ON "failure_codes"("category");

-- CreateIndex
CREATE UNIQUE INDEX "failure_codes_company_id_code_key" ON "failure_codes"("company_id", "code");

-- CreateIndex
CREATE INDEX "idx_equipment_failure_codes_equipment" ON "equipment_failure_codes"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_failure_codes_equipment_id_failure_code_id_key" ON "equipment_failure_codes"("equipment_id", "failure_code_id");

-- CreateIndex
CREATE INDEX "production_orders_dueDate_idx" ON "production_orders"("dueDate");

-- CreateIndex
CREATE INDEX "idx_production_orders_companyId" ON "production_orders"("companyId");

-- CreateIndex
CREATE INDEX "idx_production_orders_product" ON "production_orders"("productId");

-- CreateIndex
CREATE INDEX "production_orders_companyId_status_idx" ON "production_orders"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_companyId_code_key" ON "production_orders"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_id_companyId_key" ON "production_orders"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_companyId_legacy_id_key" ON "production_orders"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "idx_production_order_materials_material" ON "production_order_materials"("materialId");

-- CreateIndex
CREATE INDEX "idx_production_order_materials_order" ON "production_order_materials"("orderId");

-- CreateIndex
CREATE INDEX "idx_production_order_operations_company" ON "production_order_operations"("companyId");

-- CreateIndex
CREATE INDEX "idx_production_order_operations_orderId" ON "production_order_operations"("orderId");

-- CreateIndex
CREATE INDEX "bom_items_parentMaterialId_idx" ON "bom_items"("parentMaterialId");

-- CreateIndex
CREATE INDEX "bom_items_childMaterialId_idx" ON "bom_items"("childMaterialId");

-- CreateIndex
CREATE UNIQUE INDEX "bom_items_parent_child_key" ON "bom_items"("parentMaterialId", "childMaterialId");

-- CreateIndex
CREATE UNIQUE INDEX "mrp_parameters_materialId_key" ON "mrp_parameters"("materialId");

-- CreateIndex
CREATE INDEX "idx_mrp_parameters_material" ON "mrp_parameters"("materialId");

-- CreateIndex
CREATE INDEX "mrp_runs_companyId_idx" ON "mrp_runs"("companyId");

-- CreateIndex
CREATE INDEX "mrp_runs_runDate_idx" ON "mrp_runs"("runDate");

-- CreateIndex
CREATE INDEX "mrp_suggestions_status_idx" ON "mrp_suggestions"("status");

-- CreateIndex
CREATE INDEX "mrp_suggestions_type_idx" ON "mrp_suggestions"("type");

-- CreateIndex
CREATE INDEX "idx_mrp_suggestions_material" ON "mrp_suggestions"("materialId");

-- CreateIndex
CREATE INDEX "idx_mrp_suggestions_run" ON "mrp_suggestions"("runId");

-- CreateIndex
CREATE INDEX "idx_work_centers_companyId" ON "work_centers"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "work_centers_code_companyId_key" ON "work_centers"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "work_centers_companyId_legacy_id_key" ON "work_centers"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "production_logs_shiftDate_idx" ON "production_logs"("shiftDate");

-- CreateIndex
CREATE INDEX "idx_production_logs_order" ON "production_logs"("productionOrderId");

-- CreateIndex
CREATE INDEX "idx_production_logs_workcenter" ON "production_logs"("workCenterId");

-- CreateIndex
CREATE INDEX "machine_stops_startTime_idx" ON "machine_stops"("startTime");

-- CreateIndex
CREATE INDEX "machine_stops_stopType_idx" ON "machine_stops"("stopType");

-- CreateIndex
CREATE INDEX "idx_machine_stops_productionlog" ON "machine_stops"("productionLogId");

-- CreateIndex
CREATE INDEX "idx_machine_stops_workcenter" ON "machine_stops"("workCenterId");

-- CreateIndex
CREATE INDEX "oee_targets_companyId_idx" ON "oee_targets"("companyId");

-- CreateIndex
CREATE INDEX "oee_targets_year_month_idx" ON "oee_targets"("year", "month");

-- CreateIndex
CREATE INDEX "idx_oee_targets_workcenter" ON "oee_targets"("workCenterId");

-- CreateIndex
CREATE INDEX "idx_production_costs_company_id" ON "production_costs"("company_id");

-- CreateIndex
CREATE INDEX "idx_production_costs_production_order_id" ON "production_costs"("production_order_id");

-- CreateIndex
CREATE INDEX "idx_production_costs_status" ON "production_costs"("status");

-- CreateIndex
CREATE INDEX "idx_production_cost_materials_production_cost_id" ON "production_cost_materials"("production_cost_id");

-- CreateIndex
CREATE INDEX "idx_production_cost_labor_production_cost_id" ON "production_cost_labor"("production_cost_id");

-- CreateIndex
CREATE INDEX "idx_material_standard_costs_company_id" ON "material_standard_costs"("company_id");

-- CreateIndex
CREATE INDEX "idx_material_standard_costs_material_id" ON "material_standard_costs"("material_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_cnpj_key" ON "suppliers"("cnpj");

-- CreateIndex
CREATE INDEX "idx_suppliers_companyId" ON "suppliers"("companyId");

-- CreateIndex
CREATE INDEX "suppliers_companyId_code_idx" ON "suppliers"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_companyId_legacy_id_key" ON "suppliers"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "supplier_materials_materialId_idx" ON "supplier_materials"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_materials_supplierId_materialId_key" ON "supplier_materials"("supplierId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_code_key" ON "quotes"("code");

-- CreateIndex
CREATE INDEX "idx_quotes_supplierId" ON "quotes"("supplierId");

-- CreateIndex
CREATE INDEX "idx_quote_items_materialId" ON "quote_items"("materialId");

-- CreateIndex
CREATE INDEX "idx_quote_items_quoteId" ON "quote_items"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_code_key" ON "purchase_orders"("code");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_companyId" ON "purchase_orders"("companyId");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_supplierId" ON "purchase_orders"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_orders_quoteId_idx" ON "purchase_orders"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_companyId_legacy_id_key" ON "purchase_orders"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "idx_purchase_order_items_materialId" ON "purchase_order_items"("materialId");

-- CreateIndex
CREATE INDEX "idx_purchase_order_items_purchaseOrderId" ON "purchase_order_items"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "purchase_order_items_quoteItemId_idx" ON "purchase_order_items"("quoteItemId");

-- CreateIndex
CREATE INDEX "material_requisitions_companyId_idx" ON "material_requisitions"("companyId");

-- CreateIndex
CREATE INDEX "material_requisitions_status_idx" ON "material_requisitions"("status");

-- CreateIndex
CREATE INDEX "material_requisitions_requestedAt_idx" ON "material_requisitions"("requestedAt");

-- CreateIndex
CREATE INDEX "material_requisitions_type_idx" ON "material_requisitions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "material_requisitions_companyId_code_key" ON "material_requisitions"("companyId", "code");

-- CreateIndex
CREATE INDEX "material_requisition_items_requisitionId_idx" ON "material_requisition_items"("requisitionId");

-- CreateIndex
CREATE INDEX "material_requisition_items_materialId_idx" ON "material_requisition_items"("materialId");

-- CreateIndex
CREATE INDEX "requisition_approvals_requisitionId_idx" ON "requisition_approvals"("requisitionId");

-- CreateIndex
CREATE INDEX "requisition_approvals_approverId_idx" ON "requisition_approvals"("approverId");

-- CreateIndex
CREATE INDEX "requisition_approvals_status_idx" ON "requisition_approvals"("status");

-- CreateIndex
CREATE INDEX "idx_supplier_returns_company" ON "supplier_returns"("companyId");

-- CreateIndex
CREATE INDEX "idx_supplier_returns_date" ON "supplier_returns"("returnDate");

-- CreateIndex
CREATE INDEX "idx_supplier_returns_receivedinvoiceid" ON "supplier_returns"("receivedInvoiceId");

-- CreateIndex
CREATE INDEX "idx_supplier_returns_status" ON "supplier_returns"("status");

-- CreateIndex
CREATE INDEX "idx_supplier_returns_supplier" ON "supplier_returns"("supplierId");

-- CreateIndex
CREATE INDEX "idx_supplier_return_items_material" ON "supplier_return_items"("materialId");

-- CreateIndex
CREATE INDEX "idx_supplier_return_items_receivedinvoiceitemid" ON "supplier_return_items"("receivedInvoiceItemId");

-- CreateIndex
CREATE INDEX "idx_supplier_return_items_return" ON "supplier_return_items"("returnId");

-- CreateIndex
CREATE INDEX "idx_supplier_return_items_stocklocationid" ON "supplier_return_items"("stockLocationId");

-- CreateIndex
CREATE INDEX "idx_quality_inspections_company_id" ON "quality_inspections"("company_id");

-- CreateIndex
CREATE INDEX "idx_quality_inspections_material_id" ON "quality_inspections"("material_id");

-- CreateIndex
CREATE INDEX "idx_quality_inspections_production_order_id" ON "quality_inspections"("production_order_id");

-- CreateIndex
CREATE INDEX "idx_quality_inspections_inspector_id" ON "quality_inspections"("inspector_id");

-- CreateIndex
CREATE INDEX "idx_quality_inspections_status" ON "quality_inspections"("status");

-- CreateIndex
CREATE INDEX "idx_quality_inspection_items_inspection_id" ON "quality_inspection_items"("inspection_id");

-- CreateIndex
CREATE INDEX "idx_non_conformities_company_id" ON "non_conformities"("company_id");

-- CreateIndex
CREATE INDEX "idx_non_conformities_inspection_id" ON "non_conformities"("inspection_id");

-- CreateIndex
CREATE INDEX "idx_non_conformities_material_id" ON "non_conformities"("material_id");

-- CreateIndex
CREATE INDEX "idx_non_conformities_production_order_id" ON "non_conformities"("production_order_id");

-- CreateIndex
CREATE INDEX "idx_non_conformities_status" ON "non_conformities"("status");

-- CreateIndex
CREATE INDEX "material_receivings_status_idx" ON "material_receivings"("status");

-- CreateIndex
CREATE INDEX "material_receivings_receivingDate_idx" ON "material_receivings"("receivingDate");

-- CreateIndex
CREATE INDEX "idx_material_receivings_companyId" ON "material_receivings"("companyId");

-- CreateIndex
CREATE INDEX "idx_material_receivings_invoice" ON "material_receivings"("invoiceId");

-- CreateIndex
CREATE INDEX "idx_material_receivings_location" ON "material_receivings"("locationId");

-- CreateIndex
CREATE INDEX "idx_material_receivings_purchaseorder" ON "material_receivings"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "idx_material_receivings_supplier" ON "material_receivings"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "material_receivings_code_companyId_key" ON "material_receivings"("code", "companyId");

-- CreateIndex
CREATE INDEX "material_receiving_items_status_idx" ON "material_receiving_items"("status");

-- CreateIndex
CREATE INDEX "idx_material_receiving_items_location" ON "material_receiving_items"("locationId");

-- CreateIndex
CREATE INDEX "idx_material_receiving_items_material" ON "material_receiving_items"("materialId");

-- CreateIndex
CREATE INDEX "idx_material_receiving_items_purchaseorderitem" ON "material_receiving_items"("purchaseOrderItemId");

-- CreateIndex
CREATE INDEX "idx_material_receiving_items_receiving" ON "material_receiving_items"("receivingId");

-- CreateIndex
CREATE INDEX "receiving_divergences_receivingItemId_idx" ON "receiving_divergences"("receivingItemId");

-- CreateIndex
CREATE INDEX "quality_certificates_receivingItemId_idx" ON "quality_certificates"("receivingItemId");

-- CreateIndex
CREATE INDEX "picking_lists_companyId_idx" ON "picking_lists"("companyId");

-- CreateIndex
CREATE INDEX "picking_lists_status_idx" ON "picking_lists"("status");

-- CreateIndex
CREATE INDEX "picking_lists_assignedTo_idx" ON "picking_lists"("assignedTo");

-- CreateIndex
CREATE INDEX "picking_lists_sourceId_idx" ON "picking_lists"("sourceId");

-- CreateIndex
CREATE INDEX "picking_lists_createdBy_idx" ON "picking_lists"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "picking_lists_companyId_code_key" ON "picking_lists"("companyId", "code");

-- CreateIndex
CREATE INDEX "picking_list_items_pickingListId_idx" ON "picking_list_items"("pickingListId");

-- CreateIndex
CREATE INDEX "picking_list_items_materialId_idx" ON "picking_list_items"("materialId");

-- CreateIndex
CREATE INDEX "picking_list_items_locationId_idx" ON "picking_list_items"("locationId");

-- CreateIndex
CREATE INDEX "picking_list_items_pickedBy_idx" ON "picking_list_items"("pickedBy");

-- CreateIndex
CREATE INDEX "picking_verifications_pickingListId_idx" ON "picking_verifications"("pickingListId");

-- CreateIndex
CREATE INDEX "picking_verifications_verifiedBy_idx" ON "picking_verifications"("verifiedBy");

-- CreateIndex
CREATE INDEX "customers_cnpj_idx" ON "customers"("cnpj");

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- CreateIndex
CREATE INDEX "idx_customers_companyId" ON "customers"("companyId");

-- CreateIndex
CREATE INDEX "customers_companyId_code_idx" ON "customers"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_companyId_key" ON "customers"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_companyId_legacy_id_key" ON "customers"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "leads_companyId_idx" ON "leads"("companyId");

-- CreateIndex
CREATE INDEX "leads_customerId_idx" ON "leads"("customerId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "idx_leads_assignedto" ON "leads"("assignedTo");

-- CreateIndex
CREATE UNIQUE INDEX "leads_code_companyId_key" ON "leads"("code", "companyId");

-- CreateIndex
CREATE INDEX "idx_lead_activities_lead" ON "lead_activities"("leadId");

-- CreateIndex
CREATE INDEX "sales_quotes_companyId_idx" ON "sales_quotes"("companyId");

-- CreateIndex
CREATE INDEX "sales_quotes_customerId_idx" ON "sales_quotes"("customerId");

-- CreateIndex
CREATE INDEX "sales_quotes_status_idx" ON "sales_quotes"("status");

-- CreateIndex
CREATE INDEX "idx_sales_quotes_converted_order" ON "sales_quotes"("convertedToOrderId");

-- CreateIndex
CREATE INDEX "idx_sales_quotes_lead" ON "sales_quotes"("leadId");

-- CreateIndex
CREATE INDEX "sales_quotes_companyId_status_idx" ON "sales_quotes"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sales_quotes_code_companyId_key" ON "sales_quotes"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_quotes_companyId_legacy_id_key" ON "sales_quotes"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "sales_quote_items_quoteId_idx" ON "sales_quote_items"("quoteId");

-- CreateIndex
CREATE INDEX "idx_sales_quote_items_material" ON "sales_quote_items"("materialId");

-- CreateIndex
CREATE INDEX "sales_orders_companyId_idx" ON "sales_orders"("companyId");

-- CreateIndex
CREATE INDEX "sales_orders_customerId_idx" ON "sales_orders"("customerId");

-- CreateIndex
CREATE INDEX "sales_orders_status_idx" ON "sales_orders"("status");

-- CreateIndex
CREATE INDEX "idx_sales_orders_quote" ON "sales_orders"("quoteId");

-- CreateIndex
CREATE INDEX "sales_orders_companyId_status_idx" ON "sales_orders"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_code_companyId_key" ON "sales_orders"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_companyId_legacy_id_key" ON "sales_orders"("companyId", "legacy_id");

-- CreateIndex
CREATE INDEX "sales_order_items_orderId_idx" ON "sales_order_items"("orderId");

-- CreateIndex
CREATE INDEX "idx_sales_order_items_material" ON "sales_order_items"("materialId");

-- CreateIndex
CREATE INDEX "idx_sales_order_items_production" ON "sales_order_items"("productionOrderId");

-- CreateIndex
CREATE INDEX "sales_pipelines_company_id_idx" ON "sales_pipelines"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_pipelines_company_id_name_key" ON "sales_pipelines"("company_id", "name");

-- CreateIndex
CREATE INDEX "contacts_company_id_idx" ON "contacts"("company_id");

-- CreateIndex
CREATE INDEX "contacts_customer_id_idx" ON "contacts"("customer_id");

-- CreateIndex
CREATE INDEX "opportunities_company_id_idx" ON "opportunities"("company_id");

-- CreateIndex
CREATE INDEX "opportunities_company_id_status_idx" ON "opportunities"("company_id", "status");

-- CreateIndex
CREATE INDEX "opportunities_customer_id_idx" ON "opportunities"("customer_id");

-- CreateIndex
CREATE INDEX "opportunities_pipeline_id_idx" ON "opportunities"("pipeline_id");

-- CreateIndex
CREATE INDEX "opportunities_assigned_to_idx" ON "opportunities"("assigned_to");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_company_id_code_key" ON "opportunities"("company_id", "code");

-- CreateIndex
CREATE INDEX "communication_logs_company_id_idx" ON "communication_logs"("company_id");

-- CreateIndex
CREATE INDEX "communication_logs_customer_id_idx" ON "communication_logs"("customer_id");

-- CreateIndex
CREATE INDEX "communication_logs_opportunity_id_idx" ON "communication_logs"("opportunity_id");

-- CreateIndex
CREATE INDEX "communication_logs_company_id_occurred_at_idx" ON "communication_logs"("company_id", "occurred_at");

-- CreateIndex
CREATE INDEX "lead_scoring_rules_company_id_idx" ON "lead_scoring_rules"("company_id");

-- CreateIndex
CREATE INDEX "sales_targets_company_id_idx" ON "sales_targets"("company_id");

-- CreateIndex
CREATE INDEX "sales_targets_user_id_idx" ON "sales_targets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_targets_company_id_user_id_year_month_key" ON "sales_targets"("company_id", "user_id", "year", "month");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE INDEX "system_settings_companyId_idx" ON "system_settings"("companyId");

-- CreateIndex
CREATE INDEX "system_settings_updatedBy_idx" ON "system_settings"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_companyId_key" ON "system_settings"("key", "companyId");

-- CreateIndex
CREATE INDEX "clone_logs_clonedBy_idx" ON "clone_logs"("clonedBy");

-- CreateIndex
CREATE INDEX "clone_logs_sourceCompanyId_idx" ON "clone_logs"("sourceCompanyId");

-- CreateIndex
CREATE INDEX "clone_logs_targetCompanyId_idx" ON "clone_logs"("targetCompanyId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_companyId_idx" ON "audit_logs"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "tutorials_slug_key" ON "tutorials"("slug");

-- CreateIndex
CREATE INDEX "idx_tutorials_category" ON "tutorials"("category");

-- CreateIndex
CREATE INDEX "idx_tutorials_created_by" ON "tutorials"("created_by");

-- CreateIndex
CREATE INDEX "idx_tutorials_module" ON "tutorials"("module");

-- CreateIndex
CREATE INDEX "idx_tutorials_slug" ON "tutorials"("slug");

-- CreateIndex
CREATE INDEX "idx_notifications_category" ON "notifications"("category");

-- CreateIndex
CREATE INDEX "idx_notifications_company_id" ON "notifications"("company_id");

-- CreateIndex
CREATE INDEX "idx_notifications_created_at" ON "notifications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_notifications_department" ON "notifications"("department_id");

-- CreateIndex
CREATE INDEX "idx_notifications_group" ON "notifications"("group_id");

-- CreateIndex
CREATE INDEX "idx_notifications_is_read" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "idx_notifications_task" ON "notifications"("task_id");

-- CreateIndex
CREATE INDEX "idx_notifications_type" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "idx_notifications_user_id" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_notification_preferences_user" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_category_key" ON "notification_preferences"("user_id", "category");

-- CreateIndex
CREATE INDEX "idx_system_logs_company_id" ON "system_logs"("company_id");

-- CreateIndex
CREATE INDEX "idx_system_logs_created_at" ON "system_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_system_logs_level" ON "system_logs"("level");

-- CreateIndex
CREATE INDEX "idx_system_logs_source" ON "system_logs"("source");

-- CreateIndex
CREATE INDEX "idx_system_logs_user_id" ON "system_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_notification_groups_company" ON "notification_groups"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_groups_code_company_id_key" ON "notification_groups"("code", "company_id");

-- CreateIndex
CREATE INDEX "idx_notification_group_members_added_by" ON "notification_group_members"("added_by");

-- CreateIndex
CREATE INDEX "idx_notification_group_members_group" ON "notification_group_members"("group_id");

-- CreateIndex
CREATE INDEX "idx_notification_group_members_user" ON "notification_group_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_group_members_group_id_user_id_key" ON "notification_group_members"("group_id", "user_id");

-- CreateIndex
CREATE INDEX "dashboards_companyId_idx" ON "dashboards"("companyId");

-- CreateIndex
CREATE INDEX "dashboards_createdBy_idx" ON "dashboards"("createdBy");

-- CreateIndex
CREATE INDEX "kpis_companyId_idx" ON "kpis"("companyId");

-- CreateIndex
CREATE INDEX "kpis_category_idx" ON "kpis"("category");

-- CreateIndex
CREATE UNIQUE INDEX "kpis_code_companyId_key" ON "kpis"("code", "companyId");

-- CreateIndex
CREATE INDEX "kpi_values_kpiId_idx" ON "kpi_values"("kpiId");

-- CreateIndex
CREATE INDEX "kpi_values_period_idx" ON "kpi_values"("period");

-- CreateIndex
CREATE INDEX "kpi_values_companyId_idx" ON "kpi_values"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_values_kpiId_period_key" ON "kpi_values"("kpiId", "period");

-- CreateIndex
CREATE INDEX "dashboard_widgets_dashboardId_idx" ON "dashboard_widgets"("dashboardId");

-- CreateIndex
CREATE INDEX "dashboard_widgets_kpiId_idx" ON "dashboard_widgets"("kpiId");

-- CreateIndex
CREATE INDEX "idx_saved_reports_companyId" ON "saved_reports"("companyId");

-- CreateIndex
CREATE INDEX "idx_saved_reports_reportType" ON "saved_reports"("reportType");

-- CreateIndex
CREATE INDEX "idx_saved_reports_userId" ON "saved_reports"("userId");

-- CreateIndex
CREATE INDEX "idx_ai_usage_logs_company_created" ON "ai_usage_logs"("company_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ai_usage_logs_provider_model" ON "ai_usage_logs"("provider", "model");

-- CreateIndex
CREATE INDEX "idx_ai_usage_logs_task_type" ON "ai_usage_logs"("task_type");

-- CreateIndex
CREATE INDEX "ai_usage_logs_company_id_idx" ON "ai_usage_logs"("company_id");

-- CreateIndex
CREATE INDEX "embeddings_entity_type_company_id_idx" ON "embeddings"("entity_type", "company_id");

-- CreateIndex
CREATE INDEX "embeddings_company_id_idx" ON "embeddings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "embeddings_entity_type_entity_id_key" ON "embeddings"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "webhook_configs_company_id_idx" ON "webhook_configs"("company_id");

-- CreateIndex
CREATE INDEX "webhook_configs_status_idx" ON "webhook_configs"("status");

-- CreateIndex
CREATE INDEX "webhook_configs_created_by_idx" ON "webhook_configs"("created_by");

-- CreateIndex
CREATE INDEX "webhook_events_company_id_idx" ON "webhook_events"("company_id");

-- CreateIndex
CREATE INDEX "webhook_events_event_type_idx" ON "webhook_events"("event_type");

-- CreateIndex
CREATE INDEX "webhook_events_created_at_idx" ON "webhook_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "webhook_events_entity_type_entity_id_idx" ON "webhook_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhook_id_idx" ON "webhook_deliveries"("webhook_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_event_id_idx" ON "webhook_deliveries"("event_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_created_at_idx" ON "webhook_deliveries"("created_at" DESC);

-- CreateIndex
CREATE INDEX "webhook_deliveries_next_retry_at_idx" ON "webhook_deliveries"("next_retry_at");

-- CreateIndex
CREATE INDEX "idx_tasks_company" ON "tasks"("company_id");

-- CreateIndex
CREATE INDEX "idx_tasks_created_by" ON "tasks"("created_by");

-- CreateIndex
CREATE INDEX "idx_tasks_deadline" ON "tasks"("deadline");

-- CreateIndex
CREATE INDEX "idx_tasks_entity" ON "tasks"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_tasks_notification" ON "tasks"("notification_id");

-- CreateIndex
CREATE INDEX "idx_tasks_owner" ON "tasks"("owner_id");

-- CreateIndex
CREATE INDEX "idx_tasks_status" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "idx_tasks_target_department" ON "tasks"("target_department_id");

-- CreateIndex
CREATE INDEX "idx_tasks_target_group" ON "tasks"("target_group_id");

-- CreateIndex
CREATE INDEX "idx_tasks_target_user" ON "tasks"("target_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_code_company_id_key" ON "tasks"("code", "company_id");

-- CreateIndex
CREATE INDEX "idx_task_history_new_owner" ON "task_history"("new_owner_id");

-- CreateIndex
CREATE INDEX "idx_task_history_old_owner" ON "task_history"("old_owner_id");

-- CreateIndex
CREATE INDEX "idx_task_history_task" ON "task_history"("task_id");

-- CreateIndex
CREATE INDEX "idx_task_history_user" ON "task_history"("user_id");

-- CreateIndex
CREATE INDEX "idx_task_attachments_task_id" ON "task_attachments"("task_id");

-- CreateIndex
CREATE INDEX "workflow_definitions_companyId_idx" ON "workflow_definitions"("companyId");

-- CreateIndex
CREATE INDEX "workflow_definitions_category_idx" ON "workflow_definitions"("category");

-- CreateIndex
CREATE INDEX "workflow_definitions_createdBy_idx" ON "workflow_definitions"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_companyId_code_key" ON "workflow_definitions"("companyId", "code");

-- CreateIndex
CREATE INDEX "workflow_steps_definitionId_idx" ON "workflow_steps"("definitionId");

-- CreateIndex
CREATE INDEX "workflow_steps_escalationUserId_idx" ON "workflow_steps"("escalationUserId");

-- CreateIndex
CREATE INDEX "workflow_transitions_definitionId_idx" ON "workflow_transitions"("definitionId");

-- CreateIndex
CREATE INDEX "workflow_transitions_fromStepId_idx" ON "workflow_transitions"("fromStepId");

-- CreateIndex
CREATE INDEX "workflow_transitions_toStepId_idx" ON "workflow_transitions"("toStepId");

-- CreateIndex
CREATE INDEX "workflow_instances_companyId_idx" ON "workflow_instances"("companyId");

-- CreateIndex
CREATE INDEX "workflow_instances_status_idx" ON "workflow_instances"("status");

-- CreateIndex
CREATE INDEX "workflow_instances_entityType_entityId_idx" ON "workflow_instances"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "workflow_instances_cancelledBy_idx" ON "workflow_instances"("cancelledBy");

-- CreateIndex
CREATE INDEX "workflow_instances_currentStepId_idx" ON "workflow_instances"("currentStepId");

-- CreateIndex
CREATE INDEX "workflow_instances_definitionId_idx" ON "workflow_instances"("definitionId");

-- CreateIndex
CREATE INDEX "workflow_instances_startedBy_idx" ON "workflow_instances"("startedBy");

-- CreateIndex
CREATE INDEX "workflow_step_history_instanceId_idx" ON "workflow_step_history"("instanceId");

-- CreateIndex
CREATE INDEX "workflow_step_history_assignedTo_idx" ON "workflow_step_history"("assignedTo");

-- CreateIndex
CREATE INDEX "workflow_step_history_completedBy_idx" ON "workflow_step_history"("completedBy");

-- CreateIndex
CREATE INDEX "workflow_step_history_stepId_idx" ON "workflow_step_history"("stepId");

-- AddForeignKey
ALTER TABLE "company_onboarding" ADD CONSTRAINT "company_onboarding_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_company_permissions" ADD CONSTRAINT "user_company_permissions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_company_permissions" ADD CONSTRAINT "user_company_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_videos" ADD CONSTRAINT "product_videos_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_attachments" ADD CONSTRAINT "product_attachments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ged_documents" ADD CONSTRAINT "ged_documents_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ged_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ged_documents" ADD CONSTRAINT "ged_documents_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ged_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ged_categories" ADD CONSTRAINT "ged_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ged_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ged_access_logs" ADD CONSTRAINT "ged_access_logs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ged_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esocial_configs" ADD CONSTRAINT "esocial_configs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esocial_rubrics" ADD CONSTRAINT "esocial_rubrics_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esocial_batches" ADD CONSTRAINT "esocial_batches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esocial_events" ADD CONSTRAINT "esocial_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esocial_events" ADD CONSTRAINT "esocial_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "esocial_events" ADD CONSTRAINT "esocial_events_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "esocial_batches"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_bankaccount_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_costcenter_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "received_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payable_payments" ADD CONSTRAINT "payable_payments_payableId_fkey" FOREIGN KEY ("payableId") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_parent_fkey" FOREIGN KEY ("parentId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_account_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_payable_fkey" FOREIGN KEY ("payableId") REFERENCES "accounts_payable"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_receivable_fkey" FOREIGN KEY ("receivableId") REFERENCES "accounts_receivable"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_transfer_fkey" FOREIGN KEY ("transferToAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pix_transactions" ADD CONSTRAINT "pix_transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pix_transactions" ADD CONSTRAINT "pix_transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_bankaccount_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_costcenter_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_customer_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_issuedInvoiceId_fkey" FOREIGN KEY ("issuedInvoiceId") REFERENCES "issued_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_bankaccount_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_receivable_fkey" FOREIGN KEY ("receivableId") REFERENCES "accounts_receivable"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_transaction_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "bank_transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payable_approvals" ADD CONSTRAINT "payable_approvals_approver_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payable_approvals" ADD CONSTRAINT "payable_approvals_payable_fkey" FOREIGN KEY ("payableId") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payable_attachments" ADD CONSTRAINT "payable_attachments_payable_fkey" FOREIGN KEY ("payableId") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payable_cost_allocations" ADD CONSTRAINT "payable_cost_allocations_costcenter_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payable_cost_allocations" ADD CONSTRAINT "payable_cost_allocations_payable_fkey" FOREIGN KEY ("payableId") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "approval_thresholds" ADD CONSTRAINT "approval_thresholds_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "approval_threshold_approvers" ADD CONSTRAINT "approval_threshold_approvers_threshold_fkey" FOREIGN KEY ("thresholdId") REFERENCES "approval_thresholds"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "approval_threshold_approvers" ADD CONSTRAINT "approval_threshold_approvers_user_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_accounts" ADD CONSTRAINT "budget_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_accounts" ADD CONSTRAINT "budget_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "budget_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_versions" ADD CONSTRAINT "budget_versions_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_versions" ADD CONSTRAINT "budget_versions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_versions" ADD CONSTRAINT "budget_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_entries" ADD CONSTRAINT "budget_entries_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "budget_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_entries" ADD CONSTRAINT "budget_entries_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_entries" ADD CONSTRAINT "budget_entries_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "budget_versions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_actuals" ADD CONSTRAINT "budget_actuals_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "budget_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_actuals" ADD CONSTRAINT "budget_actuals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_actuals" ADD CONSTRAINT "budget_actuals_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "budget_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "budget_versions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "approval_levels" ADD CONSTRAINT "approval_levels_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "approval_level_approvers" ADD CONSTRAINT "approval_level_approvers_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "approval_levels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "approval_level_approvers" ADD CONSTRAINT "approval_level_approvers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_currentLevelId_fkey" FOREIGN KEY ("currentLevelId") REFERENCES "approval_levels"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_payableId_fkey" FOREIGN KEY ("payableId") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_approvals" ADD CONSTRAINT "payment_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_approvals" ADD CONSTRAINT "payment_approvals_delegatedTo_fkey" FOREIGN KEY ("delegatedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_approvals" ADD CONSTRAINT "payment_approvals_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "approval_levels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_approvals" ADD CONSTRAINT "payment_approvals_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "payment_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dda_boletos" ADD CONSTRAINT "dda_boletos_accounts_payable_id_fkey" FOREIGN KEY ("accounts_payable_id") REFERENCES "accounts_payable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dda_boletos" ADD CONSTRAINT "dda_boletos_aprovado_por_fkey" FOREIGN KEY ("aprovado_por") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dda_boletos" ADD CONSTRAINT "dda_boletos_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dda_boletos" ADD CONSTRAINT "dda_boletos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dda_boletos" ADD CONSTRAINT "dda_boletos_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dda_config" ADD CONSTRAINT "dda_config_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dda_sync_log" ADD CONSTRAINT "dda_sync_log_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dda_sync_log" ADD CONSTRAINT "dda_sync_log_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "dda_config"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collection_rules" ADD CONSTRAINT "collection_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collection_rule_steps" ADD CONSTRAINT "collection_rule_steps_collection_rule_id_fkey" FOREIGN KEY ("collection_rule_id") REFERENCES "collection_rules"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collection_actions" ADD CONSTRAINT "collection_actions_collection_rule_id_fkey" FOREIGN KEY ("collection_rule_id") REFERENCES "collection_rules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collection_actions" ADD CONSTRAINT "collection_actions_receivable_id_fkey" FOREIGN KEY ("receivable_id") REFERENCES "accounts_receivable"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collection_actions" ADD CONSTRAINT "collection_actions_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "collection_rule_steps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounting_entry_items" ADD CONSTRAINT "accounting_entry_items_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "accounting_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry_items" ADD CONSTRAINT "accounting_entry_items_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry_items" ADD CONSTRAINT "accounting_entry_items_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_movements" ADD CONSTRAINT "asset_movements_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "received_invoices" ADD CONSTRAINT "received_invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "received_invoices" ADD CONSTRAINT "received_invoices_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "received_invoices" ADD CONSTRAINT "received_invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "received_invoice_items" ADD CONSTRAINT "received_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "received_invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "received_invoice_items" ADD CONSTRAINT "received_invoice_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "received_invoice_items" ADD CONSTRAINT "received_invoice_items_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "purchase_order_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issued_invoices" ADD CONSTRAINT "issued_invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issued_invoices" ADD CONSTRAINT "issued_invoices_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issued_invoice_items" ADD CONSTRAINT "issued_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "issued_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issued_invoice_items" ADD CONSTRAINT "issued_invoice_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sefaz_sync_configs" ADD CONSTRAINT "sefaz_sync_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sefaz_sync_logs" ADD CONSTRAINT "sefaz_sync_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sefaz_pending_nfes" ADD CONSTRAINT "sefaz_pending_nfes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sefaz_pending_nfes" ADD CONSTRAINT "sefaz_pending_nfes_receivedInvoiceId_fkey" FOREIGN KEY ("receivedInvoiceId") REFERENCES "received_invoices"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sefaz_manifestacao_logs" ADD CONSTRAINT "fk_manifestacao_pending_nfe" FOREIGN KEY ("pendingNfeId") REFERENCES "sefaz_pending_nfes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "import_documents" ADD CONSTRAINT "import_documents_import_process_id_fkey" FOREIGN KEY ("import_process_id") REFERENCES "import_processes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nfe_queue_jobs" ADD CONSTRAINT "fk_nfe" FOREIGN KEY ("nfe_id") REFERENCES "issued_invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fiscal_obligations" ADD CONSTRAINT "fiscal_obligations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_apurations" ADD CONSTRAINT "tax_apurations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_apuration_items" ADD CONSTRAINT "tax_apuration_items_apuration_id_fkey" FOREIGN KEY ("apuration_id") REFERENCES "tax_apurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfse_configs" ADD CONSTRAINT "nfse_configs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfse_issued" ADD CONSTRAINT "nfse_issued_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfse_issued" ADD CONSTRAINT "nfse_issued_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "difal_calculations" ADD CONSTRAINT "difal_calculations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloco_k_records" ADD CONSTRAINT "bloco_k_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_goals" ADD CONSTRAINT "strategic_goals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "strategic_goals" ADD CONSTRAINT "strategic_goals_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "strategic_goals" ADD CONSTRAINT "strategic_goals_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "strategic_goals" ADD CONSTRAINT "strategic_goals_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "strategic_goals"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goal_indicators" ADD CONSTRAINT "goal_indicators_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goal_indicators" ADD CONSTRAINT "goal_indicators_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "strategic_goals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "indicator_history" ADD CONSTRAINT "indicator_history_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "goal_indicators"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "strategic_goals"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "goal_indicators"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "action_plan_tasks" ADD CONSTRAINT "action_plan_tasks_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "action_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "action_plan_tasks" ADD CONSTRAINT "action_plan_tasks_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_costCenter_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_fkey" FOREIGN KEY ("parentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "job_positions" ADD CONSTRAINT "job_positions_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "job_positions" ADD CONSTRAINT "job_positions_department_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_fkey" FOREIGN KEY ("managerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_position_fkey" FOREIGN KEY ("positionId") REFERENCES "job_positions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "time_clock_entries" ADD CONSTRAINT "time_clock_entries_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "time_clock_entries" ADD CONSTRAINT "time_clock_entries_employee_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "timesheet_days" ADD CONSTRAINT "timesheet_days_employee_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_shifts" ADD CONSTRAINT "work_shifts_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "work_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_schedules" ADD CONSTRAINT "employee_schedules_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "work_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_employee_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payroll_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payroll_events" ADD CONSTRAINT "payroll_events_item_fkey" FOREIGN KEY ("payrollItemId") REFERENCES "payroll_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vacations" ADD CONSTRAINT "vacations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vacations" ADD CONSTRAINT "vacations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thirteenth_salaries" ADD CONSTRAINT "thirteenth_salaries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thirteenth_salaries" ADD CONSTRAINT "thirteenth_salaries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "terminations" ADD CONSTRAINT "terminations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "terminations" ADD CONSTRAINT "terminations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_benefits" ADD CONSTRAINT "employee_benefits_benefit_type_id_fkey" FOREIGN KEY ("benefit_type_id") REFERENCES "benefit_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_benefits" ADD CONSTRAINT "employee_benefits_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transport_vouchers" ADD CONSTRAINT "transport_vouchers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_trainings" ADD CONSTRAINT "employee_trainings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_trainings" ADD CONSTRAINT "employee_trainings_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "skill_matrix" ADD CONSTRAINT "skill_matrix_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "admission_steps" ADD CONSTRAINT "admission_steps_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admission_processes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admission_processes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "admission_exams" ADD CONSTRAINT "admission_exams_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admission_processes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_dependents" ADD CONSTRAINT "employee_dependents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_records" ADD CONSTRAINT "leave_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_types" ADD CONSTRAINT "cargo_types_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incoterms" ADD CONSTRAINT "incoterms_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_processes" ADD CONSTRAINT "import_processes_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "customs_brokers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "import_processes" ADD CONSTRAINT "import_processes_cargo_type_id_fkey" FOREIGN KEY ("cargo_type_id") REFERENCES "cargo_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "import_processes" ADD CONSTRAINT "import_processes_destination_port_id_fkey" FOREIGN KEY ("destination_port_id") REFERENCES "ports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "import_processes" ADD CONSTRAINT "import_processes_incoterm_id_fkey" FOREIGN KEY ("incoterm_id") REFERENCES "incoterms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "import_processes" ADD CONSTRAINT "import_processes_origin_port_id_fkey" FOREIGN KEY ("origin_port_id") REFERENCES "ports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "import_processes" ADD CONSTRAINT "import_processes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "import_process_items" ADD CONSTRAINT "import_process_items_import_process_id_fkey" FOREIGN KEY ("import_process_id") REFERENCES "import_processes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "import_process_items" ADD CONSTRAINT "import_process_items_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "import_process_items" ADD CONSTRAINT "import_process_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "import_process_events" ADD CONSTRAINT "import_process_events_import_process_id_fkey" FOREIGN KEY ("import_process_id") REFERENCES "import_processes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "import_process_costs" ADD CONSTRAINT "import_process_costs_import_process_id_fkey" FOREIGN KEY ("import_process_id") REFERENCES "import_processes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exchange_contracts" ADD CONSTRAINT "exchange_contracts_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exchange_contracts" ADD CONSTRAINT "exchange_contracts_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "import_processes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exchange_liquidations" ADD CONSTRAINT "exchange_liquidations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "exchange_contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_parent_fkey" FOREIGN KEY ("parentId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "location_inventory" ADD CONSTRAINT "location_inventory_location_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "location_inventory" ADD CONSTRAINT "location_inventory_material_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_from_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_shippedBy_fkey" FOREIGN KEY ("shippedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_to_fkey" FOREIGN KEY ("toLocationId") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_material_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_transfer_fkey" FOREIGN KEY ("transferId") REFERENCES "stock_transfers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "physical_inventories" ADD CONSTRAINT "physical_inventories_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "physical_inventories" ADD CONSTRAINT "physical_inventories_location_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_inventory_fkey" FOREIGN KEY ("inventoryId") REFERENCES "physical_inventories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_location_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_material_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_movements" ADD CONSTRAINT "lot_movements_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intercompany_transfers" ADD CONSTRAINT "intercompany_transfers_source_company_id_fkey" FOREIGN KEY ("source_company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intercompany_transfers" ADD CONSTRAINT "intercompany_transfers_target_company_id_fkey" FOREIGN KEY ("target_company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intercompany_transfer_items" ADD CONSTRAINT "intercompany_transfer_items_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "intercompany_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intercompany_transfer_items" ADD CONSTRAINT "intercompany_transfer_items_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_equipment" ADD CONSTRAINT "maintenance_equipment_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_equipment" ADD CONSTRAINT "maintenance_equipment_work_center_id_fkey" FOREIGN KEY ("work_center_id") REFERENCES "work_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_equipment" ADD CONSTRAINT "maintenance_equipment_fixed_asset_id_fkey" FOREIGN KEY ("fixed_asset_id") REFERENCES "fixed_assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_equipment" ADD CONSTRAINT "maintenance_equipment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "maintenance_equipment"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "maintenance_equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "maintenance_equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "maintenance_plans"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_failure_code_id_fkey" FOREIGN KEY ("failure_code_id") REFERENCES "failure_codes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_order_parts" ADD CONSTRAINT "maintenance_order_parts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "maintenance_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_order_parts" ADD CONSTRAINT "maintenance_order_parts_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_order_labor" ADD CONSTRAINT "maintenance_order_labor_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "maintenance_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_order_labor" ADD CONSTRAINT "maintenance_order_labor_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_checklists" ADD CONSTRAINT "maintenance_checklists_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "maintenance_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "failure_codes" ADD CONSTRAINT "failure_codes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_failure_codes" ADD CONSTRAINT "equipment_failure_codes_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "maintenance_equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_failure_codes" ADD CONSTRAINT "equipment_failure_codes_failure_code_id_fkey" FOREIGN KEY ("failure_code_id") REFERENCES "failure_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_order_materials" ADD CONSTRAINT "production_order_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_order_materials" ADD CONSTRAINT "production_order_materials_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_order_operations" ADD CONSTRAINT "production_order_operations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_order_operations" ADD CONSTRAINT "production_order_operations_orderId_companyId_fkey" FOREIGN KEY ("orderId", "companyId") REFERENCES "production_orders"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_child_fkey" FOREIGN KEY ("childMaterialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_parent_fkey" FOREIGN KEY ("parentMaterialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mrp_parameters" ADD CONSTRAINT "mrp_parameters_material_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mrp_runs" ADD CONSTRAINT "mrp_runs_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mrp_suggestions" ADD CONSTRAINT "mrp_suggestions_material_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mrp_suggestions" ADD CONSTRAINT "mrp_suggestions_run_fkey" FOREIGN KEY ("runId") REFERENCES "mrp_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "work_centers" ADD CONSTRAINT "work_centers_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_order_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_workcenter_fkey" FOREIGN KEY ("workCenterId") REFERENCES "work_centers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "machine_stops" ADD CONSTRAINT "machine_stops_log_fkey" FOREIGN KEY ("productionLogId") REFERENCES "production_logs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "machine_stops" ADD CONSTRAINT "machine_stops_workcenter_fkey" FOREIGN KEY ("workCenterId") REFERENCES "work_centers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oee_targets" ADD CONSTRAINT "oee_targets_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oee_targets" ADD CONSTRAINT "oee_targets_workcenter_fkey" FOREIGN KEY ("workCenterId") REFERENCES "work_centers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "production_costs" ADD CONSTRAINT "production_costs_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "production_cost_materials" ADD CONSTRAINT "production_cost_materials_production_cost_id_fkey" FOREIGN KEY ("production_cost_id") REFERENCES "production_costs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "production_cost_labor" ADD CONSTRAINT "production_cost_labor_production_cost_id_fkey" FOREIGN KEY ("production_cost_id") REFERENCES "production_costs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "supplier_materials" ADD CONSTRAINT "supplier_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "supplier_materials" ADD CONSTRAINT "supplier_materials_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "quote_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requisitions" ADD CONSTRAINT "material_requisitions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requisition_items" ADD CONSTRAINT "material_requisition_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requisition_items" ADD CONSTRAINT "material_requisition_items_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "material_requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition_approvals" ADD CONSTRAINT "requisition_approvals_approver_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "requisition_approvals" ADD CONSTRAINT "requisition_approvals_requisition_fkey" FOREIGN KEY ("requisitionId") REFERENCES "material_requisitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "supplier_returns" ADD CONSTRAINT "supplier_returns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "supplier_returns" ADD CONSTRAINT "supplier_returns_receivedInvoiceId_fkey" FOREIGN KEY ("receivedInvoiceId") REFERENCES "received_invoices"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "supplier_returns" ADD CONSTRAINT "supplier_returns_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "supplier_return_items" ADD CONSTRAINT "supplier_return_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "supplier_return_items" ADD CONSTRAINT "supplier_return_items_receivedInvoiceItemId_fkey" FOREIGN KEY ("receivedInvoiceItemId") REFERENCES "received_invoice_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "supplier_return_items" ADD CONSTRAINT "supplier_return_items_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "supplier_returns"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "supplier_return_items" ADD CONSTRAINT "supplier_return_items_stockLocationId_fkey" FOREIGN KEY ("stockLocationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "fk_quality_inspections_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "fk_quality_inspections_inspector" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "fk_quality_inspections_material" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "fk_quality_inspections_production_order" FOREIGN KEY ("production_order_id") REFERENCES "production_orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quality_inspection_items" ADD CONSTRAINT "quality_inspection_items_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "quality_inspections"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "non_conformities" ADD CONSTRAINT "fk_non_conformities_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "non_conformities" ADD CONSTRAINT "fk_non_conformities_inspection" FOREIGN KEY ("inspection_id") REFERENCES "quality_inspections"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "non_conformities" ADD CONSTRAINT "fk_non_conformities_material" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "non_conformities" ADD CONSTRAINT "fk_non_conformities_production_order" FOREIGN KEY ("production_order_id") REFERENCES "production_orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "material_receivings" ADD CONSTRAINT "material_receivings_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "material_receivings" ADD CONSTRAINT "material_receivings_invoice_fkey" FOREIGN KEY ("invoiceId") REFERENCES "received_invoices"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "material_receivings" ADD CONSTRAINT "material_receivings_location_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "material_receivings" ADD CONSTRAINT "material_receivings_po_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "material_receivings" ADD CONSTRAINT "material_receivings_supplier_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "material_receiving_items" ADD CONSTRAINT "material_receiving_items_location_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "material_receiving_items" ADD CONSTRAINT "material_receiving_items_material_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "material_receiving_items" ADD CONSTRAINT "material_receiving_items_poItem_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "purchase_order_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "material_receiving_items" ADD CONSTRAINT "material_receiving_items_receiving_fkey" FOREIGN KEY ("receivingId") REFERENCES "material_receivings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receiving_divergences" ADD CONSTRAINT "receiving_divergences_item_fkey" FOREIGN KEY ("receivingItemId") REFERENCES "material_receiving_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quality_certificates" ADD CONSTRAINT "quality_certificates_item_fkey" FOREIGN KEY ("receivingItemId") REFERENCES "material_receiving_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "picking_lists" ADD CONSTRAINT "picking_lists_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "picking_lists" ADD CONSTRAINT "picking_lists_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "picking_lists" ADD CONSTRAINT "picking_lists_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "picking_list_items" ADD CONSTRAINT "picking_list_items_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "picking_list_items" ADD CONSTRAINT "picking_list_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "picking_list_items" ADD CONSTRAINT "picking_list_items_pickedBy_fkey" FOREIGN KEY ("pickedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "picking_list_items" ADD CONSTRAINT "picking_list_items_pickingListId_fkey" FOREIGN KEY ("pickingListId") REFERENCES "picking_lists"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "picking_verifications" ADD CONSTRAINT "picking_verifications_pickingListId_fkey" FOREIGN KEY ("pickingListId") REFERENCES "picking_lists"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "picking_verifications" ADD CONSTRAINT "picking_verifications_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_customer_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_lead_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_order_fkey" FOREIGN KEY ("convertedToOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_quote_items" ADD CONSTRAINT "sales_quote_items_material_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_quote_items" ADD CONSTRAINT "sales_quote_items_quote_fkey" FOREIGN KEY ("quoteId") REFERENCES "sales_quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_quote_fkey" FOREIGN KEY ("quoteId") REFERENCES "sales_quotes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_material_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_order_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_production_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_pipelines" ADD CONSTRAINT "sales_pipelines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "sales_pipelines"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lead_scoring_rules" ADD CONSTRAINT "lead_scoring_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clone_logs" ADD CONSTRAINT "clone_logs_clonedBy_fkey" FOREIGN KEY ("clonedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clone_logs" ADD CONSTRAINT "clone_logs_sourceCompanyId_fkey" FOREIGN KEY ("sourceCompanyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clone_logs" ADD CONSTRAINT "clone_logs_targetCompanyId_fkey" FOREIGN KEY ("targetCompanyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutorials" ADD CONSTRAINT "tutorials_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "notification_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_groups" ADD CONSTRAINT "notification_groups_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_group_members" ADD CONSTRAINT "notification_group_members_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_group_members" ADD CONSTRAINT "notification_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "notification_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_group_members" ADD CONSTRAINT "notification_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kpi_values" ADD CONSTRAINT "kpi_values_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kpi_values" ADD CONSTRAINT "kpi_values_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "kpis"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "dashboards"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "kpis"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "webhook_configs" ADD CONSTRAINT "webhook_configs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_configs" ADD CONSTRAINT "webhook_configs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "webhook_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "webhook_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_target_department_id_fkey" FOREIGN KEY ("target_department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_target_group_id_fkey" FOREIGN KEY ("target_group_id") REFERENCES "notification_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_new_owner_id_fkey" FOREIGN KEY ("new_owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_old_owner_id_fkey" FOREIGN KEY ("old_owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_escalationUserId_fkey" FOREIGN KEY ("escalationUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_fromStepId_fkey" FOREIGN KEY ("fromStepId") REFERENCES "workflow_steps"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_toStepId_fkey" FOREIGN KEY ("toStepId") REFERENCES "workflow_steps"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "workflow_steps"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_startedBy_fkey" FOREIGN KEY ("startedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_step_history" ADD CONSTRAINT "workflow_step_history_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_step_history" ADD CONSTRAINT "workflow_step_history_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_step_history" ADD CONSTRAINT "workflow_step_history_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workflow_step_history" ADD CONSTRAINT "workflow_step_history_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "workflow_steps"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
